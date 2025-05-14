const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying AudioNFT contract to Base Sepolia...");

  const AudioNFT = await ethers.getContractFactory("AudioNFT");
  const audioNFT = await AudioNFT.deploy();

  await audioNFT.waitForDeployment();

  const address = await audioNFT.getAddress();
  console.log(`AudioNFT deployed to: ${address}`);

  // Wait for a few block confirmations before verifying
  console.log("Waiting for block confirmations...");
  await audioNFT.deploymentTransaction()?.wait(5);

  // Verify the contract
  console.log("Verifying contract...");
  try {
    // Use hre.run for verification
    const hre = require("hardhat");
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: [],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 