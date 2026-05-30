const bookmarksList = document.getElementById('favoritesContainer');
const searchBox = document.getElementById('searchInput');
const modal = document.getElementById("modal");

const titleLabel = document.getElementById("titleLabel");
const urlLabel = document.getElementById("urlLabel")
const titleinput = document.getElementById("titleInput");
const urlinput = document.getElementById("urlInput");
const savebtn = document.getElementById("saveBtn");
const deletebtn = document.getElementById("deleteBtn");
const closebtn = document.getElementById("closeBtn");

deletebtn.innerText = chrome.i18n.getMessage("edit_delete");
savebtn.innerText = chrome.i18n.getMessage("edit_save");
closebtn.innerText = chrome.i18n.getMessage("edit_close");
titleLabel.innerText = chrome.i18n.getMessage("edit_title");
urlLabel.innerText = chrome.i18n.getMessage("edit_url");
titleinput.placeholder  = chrome.i18n.getMessage("edit_title") + "...";
urlinput.placeholder  = chrome.i18n.getMessage("edit_url") + "...";
searchBox.placeholder  = chrome.i18n.getMessage("search_placeholder") + "...";

var indexEdited = "";

searchBox.addEventListener('input', (event) => {
  searchBookmarks(event.target.value);
});

function renderBookmarks() {
  chrome.bookmarks.getTree().then((bookmarks) => {
    bookmarks.forEach((folder) => {
        if (folder.children) {
            processBookmarks(bookmarks);
        }
    });
  });
}

async function processBookmarks(bookmarks) {
  bookmarks.forEach((bookmark) => {
    if (bookmark.children) {
      // If the bookmark is a folder, recursively process its children
      processBookmarks(bookmark.children);
    } else if (bookmark.url && (bookmark.parentId == 'toolbar_____' || bookmark.parentId == "1")) {
      // If the bookmark is a link, log its title and URL
      chrome.storage.local.get(bookmark.id).then((b) => {
        bookmark.favicon = b[bookmark.id];  
        const bookmarkElement = createBookmarkElement(bookmark);
        bookmarksList.appendChild(bookmarkElement);
      });
     
    }
  });
}

function createBookmarkElement(bookmark) {
  // Create a div element to hold the bookmark information
  const bookmarkDiv = document.createElement('a');
  bookmarkDiv.className = 'favorites-item';
  bookmarkDiv.href=bookmark.url;
  bookmarkDiv.dataset.index = bookmark.id;
  bookmarkDiv.dataset.title = bookmark.title;
  bookmarkDiv.oncontextmenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    modal.style.display = "block";
    indexEdited = e.target.nodeName != 'A' ? e.target.parentNode.dataset.index : e.target.dataset.index;
    titleinput.value = e.target.nodeName != 'A' ? e.target.parentNode.dataset.title : e.target.dataset.title;
    urlinput.value = e.target.nodeName != 'A' ? e.target.parentNode.href : e.target.href;
  };
  // Create an image element for the favicon
  if(bookmark.favicon) {
    const faviconImg = document.createElement('img');
    faviconImg.src = bookmark.favicon;
    faviconImg.alt = `${bookmark.title} favicon`;
    bookmarkDiv.appendChild(faviconImg);
  } else {
    const h1Elem = document.createElement('h1');
    h1Elem.textContent = bookmark.title.substring(0,1);
    bookmarkDiv.appendChild(h1Elem);
  }

  // Create a span element for the bookmark title
  const titleSpan = document.createElement('span');
  titleSpan.textContent = bookmark.title;
  titleSpan.oncontextmenu = (e) => {
    e.preventDefault(); 
  };
  // Append the favicon and title to the bookmark div

  bookmarkDiv.appendChild(titleSpan);

  return bookmarkDiv;
}

function createClearSearchElement() {
  // Create a div element to hold the bookmark information
  const bookmarkDiv = document.createElement('a');
  bookmarkDiv.className = 'favorites-item clear';
  bookmarkDiv.href = "#";
  bookmarkDiv.onclick = () => {searchBox.value = ''; searchBookmarks(''); return false; };
  // Create an image element for the favicon
  const faviconImg = document.createElement('img');
  faviconImg.alt = chrome.i18n.getMessage("search_clean") + ` favicon`;
  bookmarkDiv.appendChild(faviconImg);

  // Create a span element for the bookmark title
  const titleSpan = document.createElement('span');
  titleSpan.textContent = chrome.i18n.getMessage("search_clean");

  // Append the favicon and title to the bookmark div

  bookmarkDiv.appendChild(titleSpan);

  return bookmarkDiv;
}


function searchBookmarks(query) {
  bookmarksList.replaceChildren();
  if(query && query.length > 0) {
    bookmarksList.appendChild(createClearSearchElement());
    chrome.bookmarks.search(query).then((bookmarks) => {
      processBookmarks(bookmarks);
    });
  } else {
    renderBookmarks();
  }
}


// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    resetAfterEdit(true);
  }
}

closebtn.onclick = function() {
  resetAfterEdit(true);
}

savebtn.onclick = function() {
  chrome.bookmarks.update(indexEdited, {title: titleinput.value , url: urlinput.value }).finally(() => {
    getFavicon(urlinput.value).then(dataURL => chrome.storage.local.set({ [indexEdited] : dataURL}).catch((er) => { console.log(er); }).finally(resetAfterEdit)); 
  });
}

deletebtn.onclick = function() {
  chrome.bookmarks.remove(indexEdited).finally(resetAfterEdit);
}

renderBookmarks();

function resetAfterEdit(dontReplaceChildren) {
  modal.classList.add("fadeout");
  indexEdited = "";
  setTimeout(() => {
    modal.style.display = "none";
    modal.classList.remove("fadeout");
    titleinput.value = "";
    urlinput.value = "";
  }, 150);
  if(!dontReplaceChildren) {
    bookmarksList.replaceChildren();
    renderBookmarks();
  }
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
