// ==UserScript==
// @name         Tweetdeck gallery
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://tweetdeck.twitter.com/
// @grant        none
// ==/UserScript==

/*
Usage

click somewhere in the page, type the number of the column you wanna see, and use letters j and k to navigate between media


PS:

needs my userstyle to work, so the tweets can be technically visible in the page

in some instanes it'll start opening links in new tabs if you try to go back through many tweets
i fixed that partially but i have no idea how to fix that entirely, ALL the links start opening in new pages
might have to do with how the event bubbles before being processed
TODO it actually has to do with the error "cannot read property "showChirp" of null" that pops up on console. showChirp is probably the function that shows the content, and it's probably doing a queryselector to find the link of the tweet it wanna show and failing to find it lmfao
check how the function works on firefox and it'll become clear what to change to make it work
there's a chance that clonning the WHOLE js-column structure with everything inside and putting my articles there will enable the code to work correctly
*/

var currentColumn = 1;
var count = 0;
var mediaTweets = [];
var mediaTweetsDict = {};

function removeAllChildren (elem) {
  while (elem.lastElementChild) {
    elem.removeChild(elem.lastElementChild);
  }
}

function doOnceLoaded(selector, func) {
    let interv = setInterval(function() {
        if (document.querySelector(selector)) {
            func();
            clearInterval(interv);
        }
    }, 500); // check every 100ms
}

function playVideo()
{
    let vid = document.querySelector("video")
    if (vid) {
        vid.play();
    }
}

function setAutoplay() {
    let node = document.querySelector("div#open-modal");
    new MutationObserver(playVideo).observe(node, { childList: true});
}

function gatherTweets() {
    return Array.from(document.querySelectorAll(`.js-column:nth-child(${currentColumn}) .js-column-holder article`));
}

function gatherMediaTweets() {
    let elements = gatherTweets();
    console.log(elements);
    elements.forEach( elem => {
        let linkElem = elem.querySelector("a.media-item");
        if (linkElem) {
            let link = linkElem.href;
            if (link.includes("t.co") && ! (link in mediaTweetsDict) && linkElem.style.visibility != "hidden") {
                // creates a new element and positions it inside .js-column so the click event bubbles up to .js-column and works
                let clone = elem.cloneNode(true);
                clone.style.display = "block"; // in case my other script changed that to none before i could clone
                trickElement.appendChild(clone);
                let linkElemInside = clone.querySelector("a.media-item");
                mediaTweetsDict[link] = "";
                mediaTweets.push(linkElemInside);
            }
        }
    });
}

function loadNextTweets() {
    let elements = gatherTweets();
    if (elements) {
        // goes up then down
        elements[elements.length - 2].scrollIntoView(false);
        elements[elements.length - 1].scrollIntoView(false);
    }
}

// doesn't really serve for anything lmfao
function loadPrevTweets() {
    let elements = gatherTweets();
    if (elements) {
        elements[0].scrollIntoView(false);
    }
}

function showCurrent() {
    if (count >= mediaTweets.length || count < 1) {
        return;
    }
    //mediaTweets[count - 1].scrollIntoView();
    mediaTweets[count - 1].click();
}

function elemExists(elem)
{
    if (elem) console.log(elem.style.display);
    return elem && elem.style.visibility != "hidden" && elem.style.display !== "none";
}

function showNext() {
    //let nextButton = document.querySelector(".js-media-gallery-next");
    //if (elemExists(nextButton)) {
    //    return;
    //}
    if (count == mediaTweets.length) {
        loadNextTweets();
    }
    gatherMediaTweets();
    if (count < mediaTweets.length) {
        count++;
        showCurrent();
    }
}

function showPrevious () {
    //let prevButton = document.querySelector(".js-media-gallery-prev");
    //if (elemExists(prevButton)) {
    //    return;
    //}
    //if (count == mediaTweets.length) {
    //    loadPrevTweets();
    //}
    gatherMediaTweets();
    if (count > 0) {
        count--;
        showCurrent();
    }
}

function setCurrentColumn (colNumber) {
    currentColumn = colNumber;
    count = 0;
    mediaTweets = []
    mediaTweetsDict = {};
    console.log(mediaTweets, mediaTweetsDict);
    removeAllChildren(trickElement);
    gatherMediaTweets();
}


function doc_keyUp(e) {
    let x = e.keyCode;
    if (x >= 49 && x <= 57){
            // numbers
            setCurrentColumn(x - 48);
    }
    switch (x) {
        case 74:
            showNext();
            break;
        case 75:
            showPrevious();
            break;
        default:
            break;
    }
}

function initialize() {
    document.querySelector(".js-column").appendChild(trickElement);
}

var trickElement = document.createElement("div");
trickElement.id = "gallery-trick";

doOnceLoaded("div.js-app-content", initialize);
doOnceLoaded("div#open-modal", setAutoplay);
document.addEventListener('keyup', doc_keyUp, false);
