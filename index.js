const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const xrpl = require("xrpl");
const {
  initialize,
  subscribe,
  saveSaltedSeed,
  loadSaltedSeed,
} = require("./library/5_helpers");

const TESTNET_URL = "wss://s.altnet.rippletest.net:51233";

const WALLET_DIR = "Wallet";

/**
 * This function creates a WebService client, which connects to the XRPL and fetches the latest ledger index.
 *
 * @returns {Promise<number>}
 */

/**
 * This is our main function, it creates our application window, preloads the code we will need to communicate
 * between the renderer Process and the main Process, loads a layout and performs the main logic
 */
const createWindow = () => {
  // Creates the application window
  const appWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, "view", "preload.js"),
    },
  });

  // Loads a layout
  appWindow.loadFile(path.join(__dirname, "view", "template.html"));

  return appWindow;
};

// Here we have to wait for the application to signal that it is ready
// to execute our code. In this case we create a main window, query
// the ledger for its latest index and submit the result to the main
// window where it will be displayed
const main = async () => {
  const appWindow = createWindow();

  // Step 3 code modifications - start
  ipcMain.on("address-entered", async (event, address) => {
    const client = new xrpl.Client(TESTNET_URL);

    await client.connect();

    // Reference: https://xrpl.org/subscribe.html
    await client.request({
      command: "subscribe",
      streams: ["ledger"],
      accounts: [address],
    });

    // Reference: https://xrpl.org/subscribe.html#ledger-stream
    client.on("ledgerClosed", async (rawLedgerData) => {
      const ledger = prepareLedgerData(rawLedgerData);
      appWindow.webContents.send("update-ledger-data", ledger);
    });

    // Initial Ledger Request -> Get account details on startup
    // Reference: https://xrpl.org/ledger.html
    const ledgerResponse = await client.request({
      command: "ledger",
    });
    const initialLedgerData = prepareLedgerData(
      ledgerResponse.result.closed.ledger
    );
    appWindow.webContents.send("update-ledger-data", initialLedgerData);

    // Reference: https://xrpl.org/subscribe.html#transaction-streams
    // Wait for transaction on subscribed account and re-request account data
    client.on("transaction", async (transaction) => {
      // Reference: https://xrpl.org/account_info.html
      const accountInfoRequest = {
        command: "account_info",
        account: address,
        ledger_index: transaction.ledger_index,
      };

      const accountInfoResponse = await client.request(accountInfoRequest);
      const accountData = prepareAccountData(
        accountInfoResponse.result.account_data
      );
      appWindow.webContents.send("update-account-data", accountData);

      // Step 4 code additions - start
      const transactions = prepareTxData([{ tx: transaction.transaction }]);
      appWindow.webContents.send("update-transaction-data", transactions);
      // Step 4 code additions - end
    });

    // Initial Account Request -> Get account details on startup
    // Reference: https://xrpl.org/account_info.html
    const accountInfoResponse = await client.request({
      command: "account_info",
      account: address,
      ledger_index: "current",
    });
    const accountData = prepareAccountData(
      accountInfoResponse.result.account_data
    );
    appWindow.webContents.send("update-account-data", accountData);

    // Step 4 code additions - start

    // Initial Transaction Request -> List account transactions on startup
    // Reference: https://xrpl.org/account_tx.html
    const txResponse = await client.request({
      command: "account_tx",
      account: address,
    });
    const transactions = prepareTxData(txResponse.result.transactions);
    appWindow.webContents.send("update-transaction-data", transactions);

    // Step 4 code additions - end
  });
};

app.whenReady().then(main);
