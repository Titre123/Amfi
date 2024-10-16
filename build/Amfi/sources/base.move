module amfi::base {
    use std::error;
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use std::option::{Self, Option, borrow};
    use aptos_std::string_utils;
    use std::object::{Self, Object, TransferRef, ConstructorRef};
    use aptos_token_objects::token::{Self, Token};
    use aptos_token_objects::collection;
    use aptos_framework::account;
    use aptos_framework::timestamp;
    use aptos_std::simple_map::{Self, SimpleMap};
    use aptos_token_objects::royalty::{Royalty};

    // Error codes
    const EUSER_NOT_REGISTERED: u64 = 1;
    const EPROTOCOL_NOT_REGISTERED: u64 = 2;
    const EQUEST_NOT_FOUND: u64 = 3;
    const ECAMPAIGN_NOT_FOUND: u64 = 4;
    const EREWARD_NOT_FOUND: u64 = 5;
    const ALREADY_EXIST: u64 = 6;
    const ENOT_TOKEN_OWNER: u64 = 1;

    // Error codes from reward_nft module
    const ENOT_AUTHORIZED: u64 = 1;
    const ETOKEN_NOT_FOUND: u64 = 2;
    const ECOLLECTION_NOT_FOUND: u64 = 3;
    const EREWARD_ALREADY_CLAIMED: u64 = 4;
    const EQUEST_NOT_COMPLETED: u64 = 5;

    struct AppState has key {
        users: vector<address>,
        rewards: vector<RewardItem>,
        protocols: vector<address>,
        quests_map: SimpleMap<String, Quest>,
        campaigns_map: SimpleMap<String, Campaign>,
        quests: vector<Quest>,
        campaigns: vector<Campaign>
    }

    struct UserState has key, copy, drop {
        quests_completed: vector<Quest>,
        current_quests: vector<Quest>,
        current_campaigns: vector<Campaign>,
        campaign_completed: vector<Campaign>,
        scratched_reward: u64,
        unscratched_reward: u64,
    }

    struct ProtocolState has key, copy {
        quests_created: vector<Quest>,
        campaigns_created: vector<Campaign>,
        rewards_minted: vector<RewardItem>,
    }

    struct CampaignMetrics has store, copy, drop {
        participants: u64,
        total_reward: u64,
        amount_claimed: u64,
        amount_unclaimed: u64,
        participants_claimed: u64,
    }

    struct QuestMetrics has store, copy, drop {
        participants: u64,
        total_reward: u64,
        amount_claimed: u64,
        amount_unclaimed: u64,
        participants_claimed: u64,
    }

    struct Quest has key, store, copy, drop {
        id: String,
        protocol: address,
        quest_title: String,
        description: String,
        quest_list: vector<QuestListItem>,
        budget: u64,
        created: u64,
        default_reward: u64,
        metric: QuestMetrics,
        token_uri: String,
        deadline: u64,
    }

    struct Campaign has key, store, copy, drop {
        id: String,
        protocol: address,
        campaign_title: String,
        description: String,
        quest_list: vector<QuestListItem>,
        status: String,
        created: u64,
        metric: CampaignMetrics,
        participants: vector<address>,
        prices: vector<u64>,
        deadline: u64,
    }

    struct QuestListItem has store, drop, copy {
        title: String,
        description: String,
        link: String,
        completed: bool
    }

    struct RewardItem has key, store, copy {
        id: String,
        scratched: bool,
        protocol_name: String,
        user_address: address,
        total_value: u64,
        remaining_value: u64,
        claim_history: vector<ClaimRecord>,
    }

    struct ClaimRecord has store, drop, copy {
        timestamp: u64,
        reward_claimed: RealWorldReward,
        value_deducted: u64,
    }

    struct RealWorldReward has store, drop, copy {
        id: String,
        name: String,
        description: String,
        price: u64,
        category: String,
        provider: String,
    }

    // RewardPower from the reward_nft module
    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct RewardPower has key {
        transfer_ref: TransferRef,
        available: u64,
        price: u64
    }


    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct RewardItemPower has key {
        transfer_ref: TransferRef,
        scratched: bool,
        available: u64,
        price: u64
    }

    // Initialize collection from reward_nft module
    public entry fun initialize_collection(creator: &signer, name: String, description: String, uri: String) {
        collection::create_unlimited_collection(
            creator,
            description,
            name,
            option::none<Royalty>(),
            uri,
        );
    }


    public fun mint_to(
        creator: &signer,
        token_name: String,
        to: address,
        colection_name: String,
        description: String,
        token_uri: String,
        price: u64,
    ) {
        let token_constructor_ref = token::create_named_token(
            creator,
            colection_name,
            description,
            token_name,
            option::none(),
            token_uri,
        );

        let token_signer = object::generate_signer(&token_constructor_ref);
        let transfer_ref = object::generate_transfer_ref(&token_constructor_ref);
        let token_object = object::object_from_constructor_ref<token::Token>(&token_constructor_ref);


        let reward_pow = RewardPower {
            transfer_ref,
            available: price,
            price
        };

        move_to(&token_signer, reward_pow);

        object::transfer(creator, token_object, to);
    }

    public fun mint_reward_to(
        creator: &signer,
        token_name: String,
        to: address,
        colection_name: String,
        description: String,
        token_uri: String,
        price: u64,
        scratched: bool
    )  {
        let token_constructor_ref = token::create_named_token(
            creator,
            colection_name,
            description,
            token_name,
            option::none(),
            token_uri,
        );

        let token_signer = object::generate_signer(&token_constructor_ref);
        let transfer_ref = object::generate_transfer_ref(&token_constructor_ref);
        let token_object = object::object_from_constructor_ref<token::Token>(&token_constructor_ref);

        let reward_pow = RewardItemPower {
            transfer_ref,
            scratched,
            available: price,
            price
        };


        move_to(&token_signer, reward_pow);

        object::transfer(creator, token_object, to);
    }

    public fun mint_to_many(
        creator: &signer,
        addresses: vector<address>,
        collection_name: String,
        token_uri: String,
        campaign_title: String,
        prices: vector<u64>
    ) {
        let i = 0;
        while (i < vector::length(&addresses)) {
            let address = vector::borrow(&addresses, i);
            let token_name = string_utils::format2(&b"Reward Nft for {} - {}", campaign_title, *address);
            let price = vector::borrow(&prices, i);

            mint_to(
                creator,
                token_name,
                *address,
                collection_name,
                string_utils::format3(
                    &b"This is a reward token from {} to {} for involvement in {} pool",
                    signer::address_of(creator),
                    *address,
                    campaign_title
                ),
                token_uri,
                *price,
            );
            i = i + 1;
        }
    }

    public fun MintRewardNfts(
        creator: &signer,
        collection_name: String,
        token_uris: vector<String>,
        reward_company: vector<String>,
    ) {
        let i = 0;
        let length_token = vector::length(&token_uris) * 5;
        while (i < length_token)  {
            let reward_comp = vector::borrow(&reward_company, i);
            let token_name = string_utils::format1(&b"Reward NFT token {}", *reward_comp);
            let token_desc =  string_utils::format1(&b"This is a reward nft for {}. Partipate in quest and campaign to earn", *reward_comp);
            let price = i * 5;
            let token_uri= vector::borrow(&token_uris, i % 10);

            mint_reward_to(
                creator,
                token_name,
                signer::address_of(creator),
                collection_name,
                token_desc,
                *token_uri,
                price,
                false
            );
            i = i + 1;
        }
    }

    // App module functions
    fun init_module(account: &signer) {
        let app_state = AppState {
            users: vector::empty<address>(),
            rewards: vector::empty<RewardItem>(),
            protocols: vector::empty<address>(),
            quests_map: simple_map::new<String, Quest>(),
            campaigns_map: simple_map::new<String, Campaign>(),
            quests: vector::empty<Quest>(),
            campaigns: vector::empty<Campaign>(),
        };

        let collection_name = string_utils::format1(&b"Amfi Reward NFTS - {}", string_utils::to_string(&signer::address_of(account)));
        let collection_desc = string::utf8(b"This is the reward collection for NFTS used to reward Amfi users");
        let collection_uri = string::utf8(b"");

        initialize_collection(
            account, collection_name, collection_desc, collection_uri);
        move_to(account, app_state);
    }

    public entry fun CreateRewardNfts(account: &signer) {
        let collection_name = string_utils::format1(&b"Amfi Reward NFTS - {}", string_utils::to_string(&signer::address_of(account)));
        MintRewardNfts(account,
            collection_name,
            vector[string::utf8(b"https://violet-patient-squid-248.mypinata.cloud/ipfs/QmRz5JnX9KqXEBTcG1RPefZTps8EniqumD6R5LCD9QJPV5"),
                string::utf8(b"https://violet-patient-squid-248.mypinata.cloud/ipfs/QmZYCbXA4AhKt7DiNYqvQE3mQRwoCBnYmUQw7KjB98PzAP"),
                string::utf8(b"https://violet-patient-squid-248.mypinata.cloud/ipfs/QmQRw7SHY4TVv5zZb2dm3JRBMJ3zaaD3mwasVZYmSkmDPB"),
                string::utf8(b"https://violet-patient-squid-248.mypinata.cloud/ipfs/QmNzxnjhPSpct875unvGpXuqFaaoB6k6mytXeh1gf2Ur5g"),
                string::utf8(b"https://violet-patient-squid-248.mypinata.cloud/ipfs/QmNRcPMLnJx7LnrVV5YhcRpQ1eUf9yP9kDiQmAJy8BNPC4"),
                string::utf8(b"https://violet-patient-squid-248.mypinata.cloud/ipfs/QmV72bJ3xtX6jULfywKnb3pj2N9TFh3znkZ6x4vpPHxKdR"),
                string::utf8(b"https://violet-patient-squid-248.mypinata.cloud/ipfs/QmRcfKFP1v8Zq2WUdLvWQ45wqXSqtKXx89PBLQjTTKH4gC"),
                string::utf8(b"https://violet-patient-squid-248.mypinata.cloud/ipfs/QmWhSBghstDrj7smgchVPRyywaAySCf5xWJQkZDNg3Vofq")],
            vector[string::utf8(b"Walmart"), string::utf8(b"Netflix"), string::utf8(b"Uber"), string::utf8(b"Glovo")
                ,string::utf8(b"Chowdeck"),string::utf8(b"Doordash"),string::utf8(b"Bolt"),string::utf8(b"Instacart")]);
    }

    public entry fun register_user(user: &signer) acquires AppState {
        let user_addr = signer::address_of(user);

        if (!exists<UserState>(user_addr)) {
               move_to(user, UserState {
                    quests_completed: vector::empty(),
                    current_quests: vector::empty(),
                    current_campaigns: vector::empty(),
                    campaign_completed: vector::empty(),
                    scratched_reward: 0,
                    unscratched_reward:0,
               });

            let app_state = borrow_global_mut<AppState>(@amfi);
            vector::push_back(&mut app_state.users, user_addr);

            let collection_description = string_utils::format1(
                &b"Quests nfts for {}", user_addr
            );
            let collection_uri= string::utf8(b"https://violet-patient-squid-248.mypinata.cloud/ipfs/bafkreiarcmrsmokumqo2bztyyjesh4h7mwamuxzdawfdqlexedddzzmkpy");
            let collection_name= string_utils::format1(&b"This is a collection of all the quest NFT earned by {}", user_addr);

            initialize_collection(user, collection_name, collection_description, collection_uri);
        };
    }

    public entry fun register_protocol(protocol: &signer) acquires AppState {
        let protocol_addr = signer::address_of(protocol);

        if (!exists<ProtocolState>(protocol_addr)) {
            move_to(protocol, ProtocolState {
            quests_created: vector::empty(),
            campaigns_created: vector::empty(),
            rewards_minted: vector::empty(),
        });

        let app_state = borrow_global_mut<AppState>(@amfi);
        vector::push_back(&mut app_state.protocols, protocol_addr);
        }
    }

    public entry fun create_quest(
        protocol: &signer,
        quest_title: String,
        quest_id: String,
        description: String,
        quest_links: vector<String>,
        quest_description: vector<String>,
        quest_titles: vector<String>,
        default_reward: u64,
        budget: u64,
        participants: u64,
        token_uri: String,
        deadline: u64
    ) acquires ProtocolState, AppState {
        let protocol_addr = signer::address_of(protocol);
        assert!(exists<ProtocolState>(protocol_addr), error::not_found(EPROTOCOL_NOT_REGISTERED));

        let protocol_state = borrow_global_mut<ProtocolState>(protocol_addr);

        let quest_items = vector::empty<QuestListItem>();
        let metric = QuestMetrics {
            participants,
            total_reward: budget,
            amount_claimed: 0,
            amount_unclaimed: budget,
            participants_claimed: 0,
        };

        let i = 0;
        while (i < vector::length(&quest_titles)) {
            let quest_item = QuestListItem {
                title: *vector::borrow(&quest_titles, i),
                description: *vector::borrow(&quest_description, i),
                link: *vector::borrow(&quest_links, i),
                completed: false
            };
            vector::push_back(&mut quest_items, quest_item);
            i = i + 1;
        };

        let quest = Quest {
            id: quest_id,
            protocol: protocol_addr,
            quest_title,
            description,
            quest_list: quest_items,
            budget,
            created: timestamp::now_seconds(),
            metric,
            default_reward,
            token_uri,
            deadline,
        };
        // assert!(vector::contains(&protocol_state.quests_created, &quest), error::already_exists(ALREADY_EXIST));

        let app_state = borrow_global_mut<AppState>(@amfi);

        if (simple_map::contains_key(&mut app_state.quests_map, &quest_id)) simple_map::add(&mut app_state.quests_map, quest_id, quest);
        vector::push_back(&mut app_state.quests, quest);

        if (!vector::contains(&protocol_state.quests_created, &quest)) vector::push_back(&mut protocol_state.quests_created, quest);
        move_to(protocol, quest);
    }

    public entry fun create_campaign(
        protocol: &signer,
        campaign_id: String,
        campaign_title: String,
        description: String,
        status: String,
        quest_links: vector<String>,
        quest_description: vector<String>,
        quest_titles: vector<String>,
        total_budget: u64,
        collection_name: String,
        collection_description: String,
        collection_uri: String,
        token_uri: String,
        participants: vector<address>,
        deadline: u64,
        prices: vector<u64>
    ) acquires ProtocolState, AppState {
        let protocol_addr = signer::address_of(protocol);
        assert!(exists<ProtocolState>(protocol_addr), error::not_found(EPROTOCOL_NOT_REGISTERED));

        let protocol_state = borrow_global_mut<ProtocolState>(protocol_addr);
        let quest_items = vector::empty<QuestListItem>();

        let metric = CampaignMetrics {
            participants: vector::length(&participants),
            total_reward: total_budget,
            amount_claimed: 0,
            amount_unclaimed: total_budget,
            participants_claimed: 0,
        };

        let i = 0;
        while (i < vector::length(&quest_titles)) {
            let quest_item = QuestListItem {
                title: *vector::borrow(&quest_titles, i),
                description: *vector::borrow(&quest_description, i),
                link: *vector::borrow(&quest_links, i),
                completed: false
            };
            vector::push_back(&mut quest_items, quest_item);
            i = i + 1;
        };

        let campaign = Campaign {
            id: campaign_id,
            protocol: protocol_addr,
            campaign_title,
            description,
            status,
            created: timestamp::now_seconds(),
            quest_list: quest_items,
            metric,
            participants,
            prices,
            deadline,
        };

        // assert!(vector::contains(&protocol_state.campaigns_created, &campaign), error::already_exists(ALREADY_EXIST));

        let app_state = borrow_global_mut<AppState>(@amfi);

        if (!simple_map::contains_key(&mut app_state.campaigns_map, &campaign_id)) simple_map::add(&mut app_state.campaigns_map, campaign_id, campaign);
        vector::push_back(&mut app_state.campaigns, campaign);

        if (!vector::contains(&protocol_state.campaigns_created, &campaign)) vector::push_back(&mut protocol_state.campaigns_created, campaign);

        initialize_collection(protocol, collection_name, collection_description, collection_uri);
        mint_to_many(protocol, participants, collection_name, token_uri, campaign_title, prices);
        move_to(protocol, campaign);
    }

    public fun complete_quest(account: &signer, quest_id: String) acquires UserState, AppState {
        let user_addr = signer::address_of(account);
        let user_state = get_users_quests(user_addr);
        let current_quest = user_state.current_quests;
        let completed_quest = user_state.quests_completed;

        let app_state = borrow_global_mut<AppState>(@amfi);
        if (simple_map::contains_key(&mut app_state.quests_map, &quest_id)) {
            let quest = simple_map::borrow(&app_state.quests_map, &quest_id);
            if (vector::contains(&current_quest, quest)) {
                let (b, i) = vector::index_of(&current_quest, quest);
                vector::remove(&mut current_quest, i);
                vector::push_back(&mut completed_quest, *quest);
            }
        }
    }

    public entry fun claimRewardNft(creator: &signer, quest_title: String, token_uri: String, collection_name: String, price: u64, quest_id: String) acquires  UserState, AppState {
        complete_quest(creator, quest_id);
        let to = &signer::address_of(creator);
        let token_name = string_utils::format2(&b"Reward Nft for {} - {}", quest_title, *to);
        let token_decription = string_utils::format3(
            &b"This is a reward token from {} to {} for involvement in {} quest",
            *to,
            *to,
            quest_title
        );

        mint_to(creator, token_name, *to, collection_name, token_decription, token_uri, price);
    }


    public entry fun claimRewardItem(account: &signer, token_obj: Object<Token>, token: Object<Token>,) acquires RewardPower, RewardItemPower, UserState {
        // redundant error checking for clear error message
        assert!(object::is_owner(token_obj, signer::address_of(account)), error::permission_denied(ENOT_TOKEN_OWNER));
        assert!(object::is_owner(token, @amfi), error::permission_denied(ENOT_TOKEN_OWNER));

        let token_address = object::object_address(&token_obj);

        let reward_power_claim = borrow_global_mut<RewardPower>(token_address);

        let reward_pow_to_claim = borrow_global<RewardItemPower>(token_address);
        let user_data = borrow_global_mut<UserState>(token_address);
        let unscratched_reward = &mut user_data.unscratched_reward;

        let transfer_ref = &reward_power_claim.transfer_ref;

        let available_price = &mut reward_power_claim.available;

        let linear_transfer_ref = object::generate_linear_transfer_ref(transfer_ref);
        object::transfer_with_ref(linear_transfer_ref, token_address);

        *unscratched_reward = *unscratched_reward + reward_pow_to_claim.price;
        *available_price = *available_price - reward_pow_to_claim.price;
    }

    public entry fun scratchRewardItem(account: &signer, token_obj: Object<Token>, token: Object<Token>,) acquires RewardItemPower, UserState {
        // redundant error checking for clear error message
        assert!(object::is_owner(token_obj, signer::address_of(account)), error::permission_denied(ENOT_TOKEN_OWNER));

        let token_address = object::object_address(&token_obj);
        assert!(object::is_owner(token, token_address), error::permission_denied(ENOT_TOKEN_OWNER));

        let to_scratch_token_address = object::object_address(&token);

        let reward_pow_to_claim = borrow_global_mut<RewardItemPower>(to_scratch_token_address);
        let user_state = borrow_global_mut<UserState>(signer::address_of(account));

        let scratched_reward = &mut user_state.scratched_reward;
        let scratched = &mut reward_pow_to_claim.scratched;
        *scratched_reward = *scratched_reward + reward_pow_to_claim.price;
        *scratched = true;
    }

    // Implement empty view functions

    #[view]
    public fun getCampaignMetrics(campaign_id: String): Campaign acquires AppState {
        let app_state = borrow_global<AppState>(@amfi);
        assert_campaign_exists(app_state, &campaign_id);
        let campaign = simple_map::borrow(&app_state.campaigns_map, &campaign_id);
        *campaign
    }

    #[view]
    public fun getQuestMetrics(quest_id: String): Quest acquires AppState {
        let app_state = borrow_global<AppState>(@amfi);
        assert_quest_exists(app_state, &quest_id);
        let quest = simple_map::borrow(&app_state.quests_map, &quest_id);
        *quest
    }

    #[view]
    public fun getProtocolMetrics(protocol: address): (vector<Quest>, vector<Campaign>, vector<RewardItem>) acquires ProtocolState {
        assert_protocol_registered(protocol);
        let protocol_state = borrow_global<ProtocolState>(protocol);
        (
            protocol_state.quests_created,
            protocol_state.campaigns_created,
            protocol_state.rewards_minted
        )
    }

    #[view]
    public fun getAppStat(): (vector<Quest>, vector<Campaign>) acquires AppState {
        let protocol_state = borrow_global<AppState>(@amfi);
        (
            protocol_state.quests,
            protocol_state.campaigns,
        )
    }


    #[view]
    public fun getUserMetric(user: address): (vector<Quest>, vector<Quest>, vector<Campaign>, vector<Campaign>) acquires UserState {
        assert_user_registered(user);
        let user_state = borrow_global<UserState>(user);
        (
            user_state.quests_completed,
            user_state.current_quests,
           user_state.current_campaigns,
            user_state.campaign_completed
        )
    }

    #[view]
    public fun getRewardItems(user: address): vector<RewardItem> acquires AppState {
        let app_state = borrow_global<AppState>(@amfi);
        let user_rewards = vector::empty<RewardItem>();
        let i = 0;
        let len = vector::length(&app_state.rewards);
        while (i < len) {
            let reward = vector::borrow(&app_state.rewards, i);
            if (reward.user_address == user) {
                vector::push_back(&mut user_rewards, *reward);
            };
            i = i + 1;
        };
        user_rewards
    }

    #[view]
    public fun get_metric_of_campaigns_by_protocol(protocol: address): vector<CampaignMetrics> acquires ProtocolState, AppState {
        assert_protocol_registered(protocol);
        let protocol_state = borrow_global<ProtocolState>(protocol);
        let app_state = borrow_global<AppState>(@amfi);
        let campaign_metrics = vector::empty<CampaignMetrics>();

        let i = 0;
        let len = vector::length(&protocol_state.campaigns_created);
        while (i < len) {
            let campaign = vector::borrow(&protocol_state.campaigns_created, i);
            let campaign_data = simple_map::borrow(&app_state.campaigns_map, &campaign.id);
            vector::push_back(&mut campaign_metrics, campaign_data.metric);
            i = i + 1;
        };

        campaign_metrics
    }

    #[view]
    public fun get_metric_of_quests_by_protocol(protocol: address): vector<QuestMetrics> acquires ProtocolState, AppState {
        assert_protocol_registered(protocol);
        let protocol_state = borrow_global<ProtocolState>(protocol);
        let app_state = borrow_global<AppState>(@amfi);
        let quest_metrics = vector::empty<QuestMetrics>();

        let i = 0;
        let len = vector::length(&protocol_state.quests_created);
        while (i < len) {
            let quest = vector::borrow(&protocol_state.quests_created, i);
            let quest_data = simple_map::borrow(&app_state.quests_map, &quest.id);
            vector::push_back(&mut quest_metrics, quest_data.metric);
            i = i + 1;
        };

        quest_metrics
    }

    // Inline assert functions

    inline fun get_users_quests(user: address): UserState acquires UserState {
        assert!(exists<UserState>(user), error::not_found(EPROTOCOL_NOT_REGISTERED));
        let user_state = borrow_global_mut<UserState>(user);
        *user_state
    }

    inline fun assert_user_registered(user: address) {
        assert!(exists<UserState>(user), error::not_found(EUSER_NOT_REGISTERED));
    }

    inline fun assert_protocol_registered(protocol: address) {
        assert!(exists<ProtocolState>(protocol), error::not_found(EPROTOCOL_NOT_REGISTERED));
    }

    inline fun assert_quest_exists(app_state: &AppState, quest_id: &String) {
        assert!(simple_map::contains_key(&app_state.quests_map, quest_id), error::not_found(EQUEST_NOT_FOUND));
    }

    inline fun assert_campaign_exists(app_state: &AppState, campaign_id: &String) {
        assert!(simple_map::contains_key(&app_state.campaigns_map, campaign_id), error::not_found(ECAMPAIGN_NOT_FOUND));
    }

}
