'use client'

import { useState, useRef, useEffect } from 'react'
import { useWallet } from '@aptos-labs/wallet-adapter-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/hooks/use-toast'
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Textarea } from "@/app/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/app/components/ui/accordion"
import { Dialog, DialogContent, DialogTrigger } from "@/app/components/ui/dialog"
import { Plus, Minus, Upload, LinkIcon, DollarSign, Calendar } from 'lucide-react'
import { nanoid } from 'nanoid'
import Cookies from 'js-cookie'
import { PinataSDK } from "pinata-web3";
import { callASmartContract } from '@/app/lib/utils'

export default function CreateQuestPage() {
  const router = useRouter();
  const { toast } = useToast()
  const [txn, setTxn] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [uploading, setUploading] = useState(false)
  const { account, signAndSubmitTransaction, connected } = useWallet();
  const moduleAddress = process.env.NEXT_PUBLIC_MODULE_ADDRESS;
  const moduleName = process.env.NEXT_PUBLIC_MODULE_NAME;

  const [questData, setQuestData] = useState({
    quest_title: '',
    quest_id: nanoid(),
    description: '',
    quest_links: [''],
    quest_description: [''],
    quest_titles: [''],
    default_reward: 0,
    budget: 0,
    participants: 0,
    token_uri: '',
    deadline: 0
  })

  const TokenImageRef = useRef<HTMLInputElement>(null)

  const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT_KEY,
    pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
  });

  useEffect(() => {
    const storedData = Cookies.get('questData');
    if (storedData) {
      setQuestData(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    if (questData.quest_title && questData.quest_description) {
      Cookies.set('questData', JSON.stringify(questData), { expires: 7 }); // Store for 7 days
    }
  }, [questData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, index: number | null = null) => {
    const { name, value } = e.target
    if (index !== null) {
      setQuestData(prev => ({
        ...prev,
        [name]: prev[name].map((item: string, i: number) => i === index ? value : item)
      }))
    } else {
      setQuestData(prev => ({ ...prev, [name]: value }))
    }
  }

  const addQuest = () => {
    setQuestData(prev => ({
      ...prev,
      quest_titles: [...prev.quest_titles, ''],
      quest_description: [...prev.quest_description, ''],
      quest_links: [...prev.quest_links, '']
    }))
  }

  const removeQuest = (index: number) => {
    setQuestData(prev => ({
      ...prev,
      quest_titles: prev.quest_titles.filter((_, i) => i !== index),
      quest_description: prev.quest_description.filter((_, i) => i !== index),
      quest_links: prev.quest_links.filter((_, i) => i !== index)
    }))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploading(true)
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      try {
        const upload = await pinata.upload.file(file);
        setQuestData(prev => ({ ...prev, collection_uri: `https://violet-patient-squid-248.mypinata.cloud/ipfs/${upload.IpfsHash}` }))
        toast({
          title: "Image Uploaded",
          description: "Collection image has been successfully uploaded.",
        })
      } catch (error) {
        console.error("Error uploading image:", error)
        toast({
          title: "Upload Failed",
          description: "There was an error uploading the image. Please try again.",
          variant: "destructive",
        })
      } finally {
        setUploading(false)
      }
    } else {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      })
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Here you would typically send the data to your backend or smart contract
    console.log(questData)
    setShowPreview(true)
    // Add your logic to interact with the smart contract here
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const createQuest = async () => {
    const deadline_tsp = Math.floor(new Date(questData.deadline).getTime() / 1000);

    const questDetails = {
      quest_title: questData.quest_title,
      quest_id: questData.quest_id,
      description: questData.description,
      quest_links: questData.quest_links,
      quest_description: questData.quest_description,
      quest_titles: questData.quest_titles,
      default_reward: questData.default_reward,
      budget: questData.budget,
      participants: questData.participants,
      token_uri: questData.token_uri,
      deadline: deadline_tsp
    };

    console.log(questDetails);

    try {
      const payload = {
        type: "entry_function_payload",
        function: `${moduleAddress}::${moduleName}::create_quest`,
        type_arguments: [],
        arguments: Object.values(questDetails),
      };

      setTxn(true);
      await callASmartContract(payload, signAndSubmitTransaction, {
        setTxn,
        description: `Quest created by ${account?.address}`,
        title: "Quest Created",
        toast
      });

      Cookies.remove('questData'); // Reset cookie after submission

      // Redirect to quests list page after successful submission
      router.push('/app/quests');
    } catch (error) {
      console.error("Error creating quest:", error);
      toast({
        title: "Quest Creation Failed",
        description: "There was an error creating your quest. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTxn(false);
    }
  }

  const Preview = ({ questData }: { questData: typeof questData }) => {
    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">{questData.quest_title || 'Untitled Quest'}</h2>
          <p className="text-muted-foreground mb-6">{questData.description || 'No description provided'}</p>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="details">
              <AccordionTrigger>Quest Details</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="text-muted-foreground" />
                    <span>Default Reward: ${questData.default_reward || 0}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-muted-foreground" />
                    <span>Deadline: {formatDate(questData.deadline)}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="quests">
              <AccordionTrigger>Quests</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {(questData.quest_titles || []).map((title, index) => (
                    <div key={index} className="border-b pb-4 last:border-b-0">
                      <h4 className="font-semibold">{title || `Quest ${index + 1}`}</h4>
                      <p className="text-sm text-muted-foreground">{questData.quest_description?.[index] || 'No description provided'}</p>
                      {questData.quest_links?.[index] && (
                        <div className="flex items-center gap-2 mt-2">
                          <LinkIcon className="w-4 h-4 text-muted-foreground" />
                          <a href={questData.quest_links[index]} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                            Quest Link
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                  {(!questData.quest_titles || questData.quest_titles.length === 0) && (
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
                    {questData.collection_uri ? (
                      <ImagePreview src={questData.collection_uri} alt="Collection Image" />
                    ) : (
                      <p className="text-sm text-muted-foreground">No collection image uploaded</p>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>

        <CardContent>
          <Button type="button" onClick={createQuest}>
            <Plus className="h-4 w-4 mr-2" /> Create Quest
          </Button>
        </CardContent>
      </Card>
    )
  }

  const ImagePreview = ({ src, alt }: { src: string, alt: string }) => (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative w-full ma-w-60 cursor-pointer hover:opacity-80 transition-opacity">
          <img src={src || '/placeholder.svg'} alt={alt} className="rounded-full h-12 w-12 object-cover" />
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
      <h1 className="text-3xl font-bold mb-8">Create New Quest</h1>
      <Tabs value={showPreview ? 'preview' : 'create'} className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">Create</TabsTrigger>
          <TabsTrigger value="preview" disabled={!showPreview}>Preview</TabsTrigger>
        </TabsList>
        {!showPreview ? <TabsContent value="create">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quest Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className='flex flex-col gap-2'>
                  <label htmlFor="quest_title" className="block text-sm font-medium mb-1">Quest Title</label>
                  <Input
                    id="quest_title"
                    name="quest_title"
                    value={questData.quest_title}
                    onChange={handleInputChange}
                    placeholder="Enter quest title"
                    required
                  />
                </div>
                <div className='flex flex-col gap-2'>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">Quest Description</label>
                  <Textarea
                    id="description"
                    name="description"
                    value={questData.description}
                    onChange={handleInputChange}
                    placeholder="Enter quest description"
                    required
                  />
                </div>

                <div className='flex flex-col md:flex-row gap-4 items-center'>
                  <div className='flex flex-col w-full gap-2'>
                    <label htmlFor="default_reward" className="block text-sm font-medium mb-1">Default Reward</label>
                    <Input
                      id="default_reward"
                      name="default_reward"
                      type="number"
                      value={questData.default_reward}
                      onChange={handleInputChange}
                      placeholder="Enter default reward"
                      required
                    />
                  </div>
                  <div className='flex flex-col w-full gap-2'>
                    <label htmlFor="budget" className="block text-sm font-medium mb-1">Budget</label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      value={questData.budget}
                      onChange={handleInputChange}
                      placeholder="Enter budget"
                      required
                    />
                  </div>
                </div>

                <div className='flex flex-col gap-2'>
                  <label htmlFor="deadline" className="block text-sm font-medium mb-1">Deadline</label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="datetime-local"
                    value={questData.deadline}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reward Token Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className='flex justify-between items-center'>
                  <div className='flex flex-col gap-2'>
                    <label htmlFor="collection_image" className="block text-sm font-medium mb-1">Token URI Image</label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="collection_image"
                        name="collection_image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        ref={TokenImageRef}
                        className="hidden"
                      />
                      <Button type="button" onClick={() => TokenImageRef.current?.click()} disabled={uploading}>
                        <Upload className="mr-2 h-4 w-4" /> {uploading ? "Uploading..." : "Upload Image"}
                      </Button>
                    </div>
                  </div>
                  {questData.token_uri && (
                    <ImagePreview src={questData.token_uri} alt="Collection" />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quest Steps</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {questData.quest_titles.map((_, index) => (
                  <div key={index} className="space-y-2 pb-4 border-b last:border-b-0">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Step {index + 1}</h3>
                      {index > 0 && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => removeQuest(index)}>
                          <Minus className="h-4 w-4" />
                          <span className="sr-only">Remove Step</span>
                        </Button>
                      )}
                    </div>
                    <Input
                      name="quest_titles"
                      value={questData.quest_titles[index]}
                      onChange={(e) => handleInputChange(e, index)}
                      placeholder="Step title"
                      required
                    />
                    <Textarea
                      name="quest_description"
                      value={questData.quest_description[index]}
                      onChange={(e) => handleInputChange(e, index)}
                      placeholder="Step description"
                      required
                    />
                    <Input
                      name="quest_links"
                      value={questData.quest_links[index]}
                      onChange={(e) => handleInputChange(e, index)}
                      placeholder="Related link (optional)"
                    />
                  </div>
                ))}
                <Button type="button" onClick={addQuest}>
                  <Plus className="h-4 w-4 mr-2" /> Add Step
                </Button>

              </CardContent>
            </Card>

            <div className='flex justify-end'>
              <Button type="submit">Preview</Button>
            </div>
          </form>
        </TabsContent> :
          <TabsContent value="preview">
            <Preview questData={questData} />
          </TabsContent>}
      </Tabs>
    </div>
  )
}