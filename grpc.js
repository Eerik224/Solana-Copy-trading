import "dotenv/config";
import Client from "@triton-one/yellowstone-grpc";
import { CommitmentLevel } from "@triton-one/yellowstone-grpc";
import { decodeInstruction } from '@solana/spl-token';
import { Connection, Keypair } from '@solana/web3.js';
import chalk from "chalk";
import { tOutPut } from "./parsingtransaction.js";
import { handleNewTokenLaunch } from "./main.js";
import dotenv from 'dotenv'
dotenv.config();
const GRPCTOKEN=process.env.GRPCTOKEN
const GRPC_ENDPOINT = process.env.GRPC_ENDPOINT

// Pre-define constants
const SOLANA_TOKEN = "So11111111111111111111111111111111111111112";
const RAYDIUM_FEE = "LanMV9sAd7wArD4vJFi2qDdfnVhFxYSUg6eADduJ3uj"//"7YttLkHDoNj9wyDur5pM1ejNaAvT9X4eqaYcHQqtj2G5";
const Raydium_launchpad_authority = "WLHv2UAZm6z4KyaaELi5pjdbJh6RESMva1Rnn8pJVVh"
// Create default client
const defaultClient = new Client(
  GRPC_ENDPOINT,
  GRPCTOKEN
);

export let isNewLaunchRunning = true;
export const stopNewLaunch = () => {
  isNewLaunchRunning = false;
  console.log(chalk.red("New launch monitoring stopped"));
};

// Default request args
const defaultArgs = {
  accounts: {},
  slots: {},
  transactions: {
    pumpfun: {
      vote: false,
      failed: false,
      signature: undefined,
      accountInclude: [RAYDIUM_FEE],
      accountExclude: [],
      accountRequired: [],
    },
  },
  transactionsStatus: {},
  entry: {},
  blocks: {},
  blocksMeta: {},
  accountsDataSlice: [],
  ping: undefined,
  commitment: CommitmentLevel.PROCESSED,
};

// This function checks for MintTo instructions by comparing with log messages
async function checkMintTo(data) {
  const tx = data.transaction?.transaction;
  const meta = data.transaction;
  if (!tx || !meta?.transaction?.meta?.logMessages) return;
  // Find if MintTo is present in log messages
  const mintToLog = meta.transaction.meta.logMessages.find((log) =>
    typeof log === "string" && log.toLowerCase().includes("instruction: mintto")
  );

  if (mintToLog) {
    console.log("🩸🩸🩸🩸🩸 MintTo found in logs!");
    return true
  } else {
    // No MintTo found in logs
    return false
  }
}


async function handleStream(client = defaultClient, args = defaultArgs) {
  const stream = await client.subscribe(args);

  const streamClosed = new Promise((resolve, reject) => {
    stream.on("error", (error) => {
      console.error("Stream Error:", error);
      reject(error);
      stream.end();
    });
    stream.on("end", resolve);
    stream.on("close", resolve);
  });

  stream.on("data", async (data) => {
    // Return early if monitoring is disabled
    if (!isNewLaunchRunning) {
      stream.end();
      return;
    }
    
    try {
    //   console.log(chalk.green("start__________new token streaming_________"));
      if (!data?.transaction?.transaction) {
        return null;
      }
      const mintTo = await checkMintTo(data)
      if(!mintTo){
        return null
    }        
    console.log(`[${new Date().toISOString()}] 🩸🩸🩸🩸🩸 MintTo found in logs!`);

      

      return null;
    } catch (error) {
      console.error("Error processing transaction data:", error);
      return null;
    }
  });

  try {
    await stream.write(args);
  } catch (error) {
    console.error("Subscription request failed:", error);
    throw error;
  }

  await streamClosed;
}



// Export client and args for external use
export { defaultClient, defaultArgs };
// Remove the auto-execution to prevent conflicts
// newlunched_subscribeCommand()