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

  // Create Wallet directory in case it does not exist yet
  if (!fs.existsSync(path.join(__dirname, WALLET_DIR))) {
    fs.mkdirSync(path.join(__dirname, WALLET_DIR));
  }

  let seed = null;

  ipcMain.on("seed-entered", async (event, providedSeed) => {
    seed = providedSeed;
    appWindow.webContents.send("open-password-dialog");
  });

  ipcMain.on("password-entered", async (event, password) => {
    if (!fs.existsSync(path.join(__dirname, WALLET_DIR, "seed.txt"))) {
      saveSaltedSeed("../" + WALLET_DIR, seed, password);
    } else {
      try {
        seed = loadSaltedSeed("../" + WALLET_DIR, password);
      } catch (error) {
        appWindow.webContents.send("open-password-dialog", true);
        return;
      }
    }

    const wallet = xrpl.Wallet.fromSeed(seed);

    const client = new xrpl.Client(TESTNET_URL);

    await client.connect();

    await subscribe(client, wallet, appWindow);

    await initialize(client, wallet, appWindow);
  });

  ipcMain.on("request-seed-change", (event) => {
    fs.rmSync(path.join(__dirname, WALLET_DIR, "seed.txt"));
    fs.rmSync(path.join(__dirname, WALLET_DIR, "salt.txt"));
    appWindow.webContents.send("open-seed-dialog");
  });

  // We have to wait for the application frontend to be ready, otherwise
  // we might run into a race condition and the open-dialog events
  // get triggered before the callbacks are attached
  appWindow.once("ready-to-show", () => {
    // If there is no seed present yet, ask for it, otherwise query for the password
    // for the seed that has been saved
    if (!fs.existsSync(path.join(__dirname, WALLET_DIR, "seed.txt"))) {
      appWindow.webContents.send("open-seed-dialog");
    } else {
      appWindow.webContents.send("open-password-dialog");
    }
  });
};

app.whenReady().then(main);
