const seedDialog = document.getElementById("seed-dialog");
const seedInput = seedDialog.querySelector("input");
const seedSubmitButton = seedDialog.querySelector('button[type="submit"]');

const seedSubmitFn = () => {
  const seed = seedInput.value;
  window.electronAPI.onEnterSeed(seed);
  seedDialog.close();
};

window.electronAPI.onOpenSeedDialog((_event) => {
  seedSubmitButton.addEventListener("click", seedSubmitFn, { once: true });

  seedDialog.showModal();
});

const passwordDialog = document.getElementById("password-dialog");
const passwordInput = passwordDialog.querySelector("input");
const passwordError = passwordDialog.querySelector("span.invalid-password");
const passwordSubmitButton = passwordDialog.querySelector(
  'button[type="submit"]'
);
const changeSeedButton = passwordDialog.querySelector('button[type="button"]');

const handlePasswordSubmitFn = () => {
  const password = passwordInput.value;
  window.electronAPI.onEnterPassword(password);
  passwordDialog.close();
};

const handleChangeSeedFn = () => {
  passwordDialog.close();
  window.electronAPI.requestSeedChange();
};

window.electronAPI.onOpenPasswordDialog(
  (_event, showInvalidPassword = false) => {
    if (showInvalidPassword) {
      passwordError.innerHTML = "INVALID PASSWORD";
    }
    passwordSubmitButton.addEventListener("click", handlePasswordSubmitFn, {
      once: true,
    });
    changeSeedButton.addEventListener("click", handleChangeSeedFn, {
      once: true,
    });
    passwordDialog.showModal();
  }
);
const accountAddressInput = accountAddressDialog.querySelector("input");
const submitButton = accountAddressDialog.querySelector(
  'button[type="submit"]'
);

submitButton.addEventListener("click", () => {
  const address = accountAddressInput.value;
  window.electronAPI.onEnterAccountAddress(address);
  accountAddressDialog.close();
});

accountAddressDialog.showModal();

const ledgerIndexEl = document.getElementById("ledger-index");
const ledgerHashEl = document.getElementById("ledger-hash");
const ledgerCloseTimeEl = document.getElementById("ledger-close-time");

window.electronAPI.onUpdateLedgerData((_event, ledger) => {
  ledgerIndexEl.innerText = ledger.ledgerIndex;
  ledgerHashEl.innerText = ledger.ledgerHash;
  ledgerCloseTimeEl.innerText = ledger.ledgerCloseTime;
});

const accountAddressClassicEl = document.getElementById(
  "account-address-classic"
);
const accountAddressXEl = document.getElementById("account-address-x");
const accountBalanceEl = document.getElementById("account-balance");

window.electronAPI.onUpdateAccountData((_event, value) => {
  accountAddressClassicEl.innerText = value.classicAddress;
  accountAddressXEl.innerText = value.xAddress;
  accountBalanceEl.innerText = value.xrpBalance;
});

const txTableBodyEl = document.getElementById("tx-table").tBodies[0];
window.testEl = txTableBodyEl;

const modalButton = document.getElementById("send-xrp-modal-button");
const modalDialog = new bootstrap.Modal(
  document.getElementById("send-xrp-modal")
);
modalButton.addEventListener("click", () => {
  modalDialog.show();
});

const accountVerificationEl = document.querySelector(
  ".accountVerificationIndicator span"
);

const destinationAddressEl = document.getElementById(
  "input-destination-address"
);
const destinationTagEl = document.getElementById("input-destination-tag");
const amountEl = document.getElementById("input-xrp-amount");
const sendXrpButtonEl = document.getElementById("send-xrp-submit-button");

destinationAddressEl.addEventListener("input", (event) => {
  window.electronAPI.onDestinationAccountChange(destinationAddressEl.value);
});

window.electronAPI.onUpdateDomainVerificationData((_event, result) => {
  accountVerificationEl.textContent = `Domain: ${
    result.domain || "n/a"
  } Verified: ${result.verified}`;
});

sendXrpButtonEl.addEventListener("click", () => {
  modalDialog.hide();
  const destinationAddress = destinationAddressEl.value;
  const destinationTag = destinationTagEl.value;
  const amount = amountEl.value;

  window.electronAPI.onClickSendXrp({
    destinationAddress,
    destinationTag,
    amount,
  });
});

window.electronAPI.onSendXrpTransactionFinish((_event, result) => {
  alert("Result: " + result.result.meta.TransactionResult);
  destinationAddressEl.value = "";
  destinationTagEl.value = "";
  amountEl.value = "";
});

window.electronAPI.onUpdateTransactionData((_event, transactions) => {
  for (let transaction of transactions) {
    txTableBodyEl.insertAdjacentHTML(
      "beforeend",
      "<tr>" +
        "<td>" +
        transaction.confirmed +
        "</td>" +
        "<td>" +
        transaction.type +
        "</td>" +
        "<td>" +
        transaction.from +
        "</td>" +
        "<td>" +
        transaction.to +
        "</td>" +
        "<td>" +
        transaction.value +
        "</td>" +
        "<td>" +
        transaction.hash +
        "</td>" +
        "</tr>"
    );
  }
});
