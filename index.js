const { app, BrowserWindow } = require("electron");

const path = require("path");
const xrpl = require("xrpl");

const TESTNET_URL = "wss://s.altnet.rippletest.net:51233";

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

  const client = new xrpl.Client(TESTNET_URL);

  await client.connect();

  // Subscribe client to 'ledger' events
  // Reference: https://xrpl.org/subscribe.html
  await client.request({
    command: "subscribe",
    streams: ["ledger"],
  });

  // Dispatch 'update-ledger-data' event
  client.on("ledgerClosed", async (ledger) => {
    appWindow.webContents.send("update-ledger-data", ledger);
  });
};

app.whenReady().then(main);
