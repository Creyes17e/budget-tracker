let db;
//Creates a new db request for a "budget" db
const request = indexedDB.open("budget_db", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;
  //This checks if app is online before it reads from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log("Error" + event.target.errorCode);
};

function saveRecord(record) {
  //Create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");

  //Access pending object Store
  const store = transaction.objectStore("pending");

  //Add record to store with add method
  store.add(record);
}

function checkDatabase() {
  //Opens a transaction on your pending db
  const transaction = db.transaction(["pending"], "readwrite");

  //Access the pending object store
  const store = transaction.objectStore("pending");
  //Grabs all records from store
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text.plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          const transaction = db.transaction(["pending"], "readwrite");

          const store = transaction.objectStore("pending");
          //Clears all items in store
          store.clear();
        });
    }
  };
}

//Listens for app coming back online
window.addEventListener("online", checkDatabase);
