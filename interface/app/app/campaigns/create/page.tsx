"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion"
import { Dialog, DialogContent, DialogTrigger } from "@/app/components/ui/dialog"
import { Label } from "@/app/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/app/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Progress } from "@/app/components/ui/progress"
import { Badge } from "@/app/components/ui/badge"
import { Plus, Minus, Upload, ArrowLeft, DollarSign, Calendar, LinkIcon, ArrowRight, Image as ImageIcon } from 'lucide-react'
import { PinataSDK } from "pinata-web3";
import { useToast } from "@/app/hooks/use-toast"
import { nanoid } from 'nanoid';
import Cookies from 'js-cookie';
import Papa from 'papaparse'; // Import PapaParse
import { callASmartContract } from '@/app/lib/utils'
import { useWallet } from '@aptos-labs/wallet-adapter-react'

export default function CreateCampaignPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [txn, setTxn] = useState(false);
  const { toast } = useToast();
  const [uploading, setUploading] = useState({
    collection_image: false,
    nft_image: false
  });
  const [campaignData, setCampaignData] = useState({
    campaign_title: '',
    description: '',
    status: '',
    quest_links: [''],
    quest_description: [''],
    quest_titles: [''],
    total_budget: 0,
    collection_name: '',
    collection_description: '',
    collection_image: null,
    nft_image: null,
    deadline: 0,
    eligibilityMethod: 'smartContract',
    smartContractLink: '',
    participants: [],
    prices: []
  })
  const collectionImageRef = useRef(null);
  const nftImageRef = useRef(null);

  const { account, signAndSubmitTransaction, connected } = useWallet();
  const moduleAddress = process.env.NEXT_PUBLIC_MODULE_ADDRESS;
  const moduleName = process.env.NEXT_PUBLIC_MODULE_NAME;

  const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT_KEY,
    pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
  });

  useEffect(() => {
    const storedData = Cookies.get('campaignData');
    console.log(JSON.parse(storedData))
    if (storedData) {
      setCampaignData(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    if (campaignData.campaign_title && campaignData.description) {
      Cookies.set('campaignData', JSON.stringify(campaignData), { expires: 7 }); // Store for 7 days
    }
  }, [campaignData]);

  const handleInputChange = (e, index = null) => {
    const { name, value } = e.target
    if (index !== null) {
      setCampaignData(prev => ({
        ...prev,
        [name]: prev[name].map((item, i) => i === index ? value : item)
      }))
    } else {
      setCampaignData(prev => ({ ...prev, [name]: value }));

    }
  }

  const handleImageUpload = async (event, imageType) => {
    setUploading(true);
    const file = event.target.files[0]
    if (file && file.type.startsWith('image/')) {
      const upload = await pinata.upload.file(file);
      setCampaignData(prev => ({ ...prev, [imageType]: `https://violet-patient-squid-248.mypinata.cloud/ipfs/${upload.IpfsHash}` }))
      setUploading(prev => ({ ...prev, [imageType]: false }));
    } else {
      setUploading(prev => ({ ...prev, [imageType]: false }));
      toast({
        title: "No File Selected",
        description: "Please select a file before uploading.",
        variant: "destructive",
      });
    }
  }

  const addQuest = () => {
    setCampaignData(prev => ({
      ...prev,
      quest_titles: [...prev.quest_titles, ''],
      quest_description: [...prev.quest_description, ''],
      quest_links: [...prev.quest_links, '']
    }))
  }

  const removeQuest = (index) => {
    setCampaignData(prev => ({
      ...prev,
      quest_titles: prev.quest_titles.filter((_, i) => i !== index),
      quest_description: prev.quest_description.filter((_, i) => i !== index),
      quest_links: prev.quest_links.filter((_, i) => i !== index)
    }))
  }

  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (file && file.type === "text/csv") {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const participants = [];
          const prices = [];
          results.data.forEach(row => {
            if (row.address) {
              participants.push(row.address);
              prices.push(row.price ? parseFloat(row.price) : 0);
            }
          });
          setCampaignData(prev => ({
            ...prev,
            participants,
            prices
          }));
        },
        error: (error) => {
          alert("Error parsing CSV file: " + error.message);
        }
      });
    } else {
      alert("Please upload a CSV file");
    }
  }
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const deadline_tsp = Math.floor(new Date(campaignData.deadline).getTime() / 1000);

    const campaignDetails = {
      campaign_id: nanoid(),
      campaign_title: campaignData.campaign_title,
      description: campaignData.description,
      status: campaignData.status || 'completed',
      quest_links: campaignData.quest_links || [],
      quest_description: campaignData.quest_description || [],
      quest_titles: campaignData.quest_titles || [],
      total_budget: parseInt(campaignData.total_budget.toString()) || 0,
      collection_name: `${campaignData.campaign_title} Collection`,
      collection_description: `Collection for the campaign titled ${campaignData.campaign_title}`,
      collection_uri: campaignData.collection_image,
      token_uri: campaignData.nft_image,
      participants: campaignData.participants || [],
      deadline: deadline_tsp,
      prices: campaignData.prices || []
    };

    setCampaignData(prev => ({
      ...prev,
      ...campaignDetails,
      deadline: deadline_tsp,
    }));

    console.log(campaignDetails);

    try {
      const payload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::${moduleName}::create_campaign`,
        type_arguments: [],
        arguments: Object.values(campaignDetails),
      };

      setTxn(true);
      await callASmartContract(payload, signAndSubmitTransaction, {
        setTxn,
        description: `Campaign created by ${account?.address}`,
        title: "Campaign Created",
        toast
      });
      Cookies.remove('campaignData');
      // Redirect to campaigns list page after successful submission
      router.push('/app/campaigns');
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Campaign Creation Failed",
        description: "There was an error creating your campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTxn(false);
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const ImagePreview = ({ src, alt }) => (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative w-full ma-w-60 cursor-pointer hover:opacity-80 transition-opacity">
          <img src={src || '/placeholder.svg'} alt={alt} className="rounded-full h-12 w-12  object-cover" />
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <div className="relative w-full h-[80vh]">
          <img src={src || '/placeholder.svg'} alt={alt} className="w-full h-full object-contain" />
        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Campaign</h1>
      <Progress value={(page / 3) * 100} className="mb-8" />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs value={`page${page}`} onValueChange={(value) => setPage(Number(value.replace('page', '')))}>
          <TabsList className="grid w-full grid-cols-1 h-full md:h-max sm:grid-cols-3">
            <TabsTrigger value="page1">Campaign Details</TabsTrigger>
            <TabsTrigger value="page2">Collection & Eligibility</TabsTrigger>
            <TabsTrigger value="page3">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="page1">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className='flex flex-col gap-2'>
                  <Label htmlFor="campaign_title">Campaign Title</Label>
                  <Input
                    id="campaign_title"
                    name="campaign_title"
                    value={campaignData.campaign_title}
                    onChange={handleInputChange}
                    placeholder="Enter campaign title"
                    required
                  />
                </div>
                <div className='flex flex-col gap-2'>
                  <Label htmlFor="description">Campaign Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={campaignData.description}
                    onChange={handleInputChange}
                    placeholder="Enter campaign description"
                    required
                  />
                </div>

                <div className='flex items-center flex-col sm:flex-row gap-4'>
                  <div className='w-full flex flex-col gap-2'>
                    <Label htmlFor="total_budget">Total Budget</Label>
                    <Input
                      id="total_budget"
                      name="total_budget"
                      type="number"
                      value={campaignData.total_budget}
                      onChange={handleInputChange}
                      placeholder="Enter total budget"
                      required
                    />
                  </div>
                  <div className='w-full flex flex-col gap-2'>
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      name="deadline"
                      type="datetime-local"
                      value={campaignData.deadline}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Quests</Label>
                  {campaignData.quest_titles.map((_, index) => (
                    <Card key={index} className="mt-4 p-4">
                      <div className="space-y-2">
                        <Input
                          name="quest_titles"
                          value={campaignData.quest_titles[index]}
                          onChange={(e) => handleInputChange(e, index)}
                          placeholder="Quest Title"
                          required
                        />
                        <Textarea
                          name="quest_description"
                          value={campaignData.quest_description[index]}
                          onChange={(e) => handleInputChange(e, index)}
                          placeholder="Quest Description"
                          required
                        />
                        <Input
                          name="quest_links"
                          value={campaignData.quest_links[index]}
                          onChange={(e) => handleInputChange(e, index)}
                          placeholder="Quest Link"
                          required
                        />
                        {index > 0 && (
                          <Button type="button" variant="destructive" onClick={() => removeQuest(index)}>
                            <Minus className="mr-2 h-4 w-4" /> Remove Quest
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                  <Button type="button" onClick={addQuest} className="mt-4">
                    <Plus className="mr-2 h-4 w-4" /> Add Quest
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={() => setPage(2)}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="page2">
            <Card>
              <CardHeader>
                <CardTitle>Collection & Eligibility</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-full flex flex-col gap-2">
                    <Label htmlFor="collection_image">NFT Collection Image</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="collection_image"
                        name="collection_image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'collection_image')}
                        ref={collectionImageRef}
                        className="hidden"
                        required
                      />
                      <Button type="button" onClick={() => {
                        setUploading(prev => ({ ...prev, collection_image: true }));
                        if (collectionImageRef.current) {
                          collectionImageRef.current.click();
                        }
                      }}>
                        <Upload className="mr-2 h-4 w-4" /> {uploading.collection_image ? "uploading" : "Upload Collection Image"}
                      </Button>
                    </div>
                  </div>

                  {campaignData.collection_image &&
                    <ImagePreview src={campaignData.collection_image} alt="Collection Image" />
                  }
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-full flex flex-col gap-2">
                    <Label htmlFor="nft_image">NFT Image</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="nft_image"
                        name="nft_image"
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'nft_image')}
                        ref={nftImageRef}
                        className="hidden"
                        required
                      />
                      <Button type="button" onClick={() => {
                        setUploading(prev => ({ ...prev, nft_image: true }));
                        if (nftImageRef.current) {
                          nftImageRef.current.click();
                        }
                      }}>
                        <Upload className="mr-2 h-4 w-4" />{uploading.nft_image ? "uploading" : "Upload Nft Image"}
                      </Button>
                    </div>
                  </div>
                  {campaignData.nft_image &&
                    <ImagePreview src={campaignData.nft_image} alt="NFT Image" />
                  }
                </div>
                <div className='flex flex-col gap-2'>
                  <Label>Eligibility Method</Label>
                  <RadioGroup className='flex flex-col gap-2' value={campaignData.eligibilityMethod} onValueChange={(value) => setCampaignData(prev => ({ ...prev, eligibilityMethod: value }))}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="smartContract" id="smartContract" />
                      <Label htmlFor="smartContract">Smart Contract</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="csvUpload" id="csvUpload" />
                      <Label htmlFor="csvUpload">CSV Upload</Label>
                    </div>
                  </RadioGroup>
                </div>
                {campaignData.eligibilityMethod === 'smartContract' && (
                  <div className='flex flex-col gap-2'>
                    <Label htmlFor="smartContractLink">Smart Contract Link</Label>
                    <Input
                      id="smartContractLink"
                      name="smartContractLink"
                      value={campaignData.smartContractLink}
                      onChange={handleInputChange}
                      placeholder="Enter smart contract link"
                      required
                    />
                  </div>
                )}
                {campaignData.eligibilityMethod === 'csvUpload' && (
                  <div className='flex flex-col gap-2'>
                    <Label htmlFor="csvFile">Upload CSV File</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="csvFile"
                        type="file"
                        onChange={handleFileUpload}
                        accept=".csv"
                        required
                      />
                      <Button type="button" size="icon" onClick={() => document.getElementById('csvFile').click()}>
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    {campaignData.csvFile && <p className="text-sm text-muted-foreground mt-2">File selected: {campaignData.csvFile.name}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
            <div className="mt-6 flex justify-between">
              <Button type="button" variant="outline" onClick={() => setPage(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button type="button" onClick={() => setPage(3)}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="page3">
            {/*
              Preview page 
             */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-4">{campaignData.campaign_title || 'Untitled Campaign'}</h2>
                <p className="text-muted-foreground mb-6">{campaignData.description || 'No description provided'}</p>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="details">
                    <AccordionTrigger>Campaign Details</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <DollarSign className="text-muted-foreground" />
                          <span>Total Budget: ${campaignData.total_budget || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="text-muted-foreground" />
                          <span>Deadline: {formatDate(campaignData.deadline)}</span>
                        </div>
                        <div>
                          <Badge variant="outline">{campaignData.status || 'Draft'}</Badge>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="quests">
                    <AccordionTrigger>Quests</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {(campaignData.quest_titles || []).map((title, index) => (
                          <div key={index} className="border-b pb-4 last:border-b-0">
                            <h4 className="font-semibold">{title || `Quest ${index + 1}`}</h4>
                            <p className="text-sm text-muted-foreground">{campaignData.quest_description?.[index] || 'No description provided'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <LinkIcon className="w-4 h-4 text-muted-foreground" />
                              <a href={campaignData.quest_links?.[index] || '#'} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                                Quest Link
                              </a>
                            </div>
                          </div>
                        ))}
                        {(!campaignData.quest_titles || campaignData.quest_titles.length === 0) && (
                          <p className="text-sm text-muted-foreground">No quests added yet</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="collection">
                    <AccordionTrigger>Collection & NFT</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Collection Image</h4>
                          {campaignData.collection_image ? (
                            <ImagePreview src={campaignData.collection_image} alt="Collection Image" />
                          ) : (
                            <p className="text-sm text-muted-foreground">No collection image uploaded</p>
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">NFT Image</h4>
                          {campaignData.nft_image ? (
                            <ImagePreview src={campaignData.nft_image} alt="NFT Image" />
                          ) : (
                            <p className="text-sm text-muted-foreground">No NFT image uploaded</p>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="eligibility">
                    <AccordionTrigger>Eligibility</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <p><span className="font-semibold">Method:</span> {campaignData.eligibilityMethod === 'smartContract' ? 'Smart Contract' : 'CSV Upload'}</p>
                        {campaignData.eligibilityMethod === 'smartContract' && (
                          <p><span className="font-semibold">Smart Contract Link:</span> {campaignData.smartContractLink || 'Not provided'}</p>
                        )}
                        {campaignData.eligibilityMethod === 'csvUpload' && campaignData.csvFile && (
                          <p><span className="font-semibold">CSV File:</span> {campaignData.csvFile.name}</p>
                        )}
                        {(!campaignData.eligibilityMethod || (campaignData.eligibilityMethod === 'csvUpload' && !campaignData.csvFile)) && (
                          <p className="text-sm text-muted-foreground">Eligibility method not set</p>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
            <div className="mt-6 flex justify-between">
              <Button type="button" variant="outline" onClick={() => setPage(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Previous
              </Button>
              <Button type="submit">Create Campaign</Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  )
}