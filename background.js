function initializeBookmarks() {
    chrome.bookmarks.getTree().then((bookmarks) => {
        bookmarks.forEach((folder) => {
            if (folder.children) {
                processBookmarks(bookmarks);
            }
        });
    });
}

 function processBookmarks(bookmarks) {
    bookmarks.forEach((bookmark) => {
      if (bookmark.children) {
        processBookmarks(bookmark.children);
      } else if (bookmark.url) {
        getFavicon(bookmark.url).then(dataURL => {
            chrome.storage.local.set({ [bookmark.id] : dataURL}).catch((er) => { console.log(er); })
        });
      }
    });
}

function getFavicon(url) {
    return fetch("https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=" + url + "&size=64", {
        method: "GET",
        mode: "cors",
    })
    .then(response => response.blob())
    .then(blob => new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    }));
}

chrome.runtime.onInstalled.addListener(initializeBookmarks);

chrome.bookmarks.onCreated.addListener((id, bookmark) => {
    getFavicon(bookmark.url).then(dataURL => {
        chrome.storage.local.set({ [id] : dataURL}).catch((er) => { console.log(er); })
    });
});

chrome.bookmarks.onChanged.addListener((id, changeInfo) => {
    if(changeInfo.url) {
        getFavicon(changeInfo.url).then(dataURL => {
            chrome.storage.local.set({ [id] : dataURL}).catch((er) => { console.log(er); })
        });
    }
});

chrome.bookmarks.onRemoved.addListener((id) => {
    chrome.storage.local.remove([id]).catch((er) => { console.log(er); });
});

