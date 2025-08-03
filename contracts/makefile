include .env
export

BASE_SEPOLIA_ARGS := --rpc-url $(RPC_URL_BASE_SEPOLIA) \
					 --account defaultKey \
					 --broadcast \
					 --verify \
					 --etherscan-api-key $(ETHERSCAN_API) \

deployTestnet:
	@forge clean
	@echo "Deploying SongDataBase to Base testnet"
	@forge script script/SongDataBase.s.sol:SongDataBaseScript $(BASE_SEPOLIA_ARGS)

unitTest:
	@echo "Running SongDataBase unit tests"
	@forge 	test --match-path \
			test/unit/$(TEST_TYPE)/SongDataBase.t.sol \
			--summary --detailed --gas-report -vvvvv --show-progress