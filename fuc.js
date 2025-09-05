import { Connection, PublicKey, LAMPORTS_PER_SOL, Keypair } from "@solana/web3.js";
import { getAccount, getAssociatedTokenAddress } from "@solana/spl-token";
import chalk from "chalk";
import dotenv from "dotenv";
import bs58 from "bs58";
dotenv.config();
import { swap } from "./swap.js";
// import { buy_pumpfun, buy_pumpswap, sell_pumpfun, sell_pumpswap } from "./swapsdk_0slot.js";
// import { buy_raydium_CPMM, buy_raydium_launchpad, sell_raydium_CPMM, sell_raydium_launchpad } from "./swapRaydium.js";

const RPC_URL = process.env.RPC_URL;
const connection = new Connection(RPC_URL, "confirmed");

//============functions============//
export const token_buy = async (mint, sol_amount, pool_status,  context) => {
 
  if (!mint) {
    throw new Error("mint is required and was not provided.");
  }
  const currentUTC = new Date();
  const txid = await swap("BUY", mint, sol_amount * LAMPORTS_PER_SOL);
  // let txid = "";
  console.log(chalk.green(`🟢BUY tokenAmount:::${sol_amount} pool_status: ${pool_status} `));


  const endUTC = new Date();
  const timeTaken = endUTC.getTime() - currentUTC.getTime();
  console.log(`⏱️ Total BUY time taken: ${timeTaken}ms (${(timeTaken / 1000).toFixed(2)}s)`);
  return txid;
};

export const token_sell = async (mint, tokenAmount, pool_status, isFull, context) => {
  try {
   
    if (!mint) {
      throw new Error("mint is required and was not provided.");
    }
    console.log(chalk.red(`🔴SELL tokenAmount:::${tokenAmount} pool_status: ${pool_status} `));

    const currentUTC = new Date();

    const txid = await swap("SELL", mint, tokenAmount);
    const endUTC = new Date();
    const timeTaken = endUTC.getTime() - currentUTC.getTime();
    console.log(`⏱️ Total SELL time taken: ${timeTaken}ms (${(timeTaken / 1000).toFixed(2)}s)`);

    if (txid === "stop") {
      console.log(chalk.red(`[${new Date().toISOString()}] 🛑 Swap returned "stop" - no balance for ${mint}`));
      return "stop";
    }

    if (txid) {
      console.log(chalk.green(`Successfully sold ${tokenAmount} tokens : https://solscan.io/tx/${txid}`));
      return txid;
    }

    return null;
  } catch (error) {
    console.error("Error in token_sell:", error.message);
    if (error.response?.data) {
      console.error("API Error details:", error.response.data);
    }
    return null;
  }
};



export const checkWalletBalance = async () => {
  try {
    const pubkey = getPublicKeyFromPrivateKey();
    const balanceLamports = await connection.getBalance(pubkey);
    const balance = balanceLamports / LAMPORTS_PER_SOL;
    return { balance };
  } catch (err) {
    console.error("Error checking wallet balance:", err.message || err);
    throw err;
  }
};


export const getPublicKeyFromPrivateKey = () => {
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("Private key is required and was not provided.");
  }
  const keypair = getKeypairFromPrivateKey(privateKey);
  return keypair.publicKey.toString();
};

