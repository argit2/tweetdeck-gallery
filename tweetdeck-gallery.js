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

click somewhere in the page, type the number of the column you wanna see, and use letters j and k to navigate between media tweets

*/

var currentColumn = 1;
var currentTweet = null;
const preemptiveLoad = 3; // if only this amount of tweets remaining to see, will attempt to load more

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
    return Array.filter(Array.from(document.querySelectorAll(`.js-column:nth-child(${currentColumn}) .js-column-holder article`)), elemExists);
}

function gatherMediaTweets() {
    let elements = gatherTweets();
    let mediaTweets = Array.filter(elements, elem => {
        let linkElem = mediaLinkElem(elem);
        if (linkElem) {
            let link = linkElem.href;
            if (link.includes("t.co")) {
                return true;
            }
        }
        return false;
    });
    return mediaTweets;
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
        // goes down then up
        elements[1].scrollIntoView(false);
        elements[0].scrollIntoView(false);
    }
}

function elemExists(elem)
{
    return elem && elem.style.visibility != "hidden" && elem.style.display !== "none";
}

function getCurrentTweet () {
    if (! currentTweet) {
        resetCurrentTweet();
    }
    return currentTweet;
}

function resetCurrentTweet () {
    let mediaTweets = gatherMediaTweets();
    if (mediaTweets) {
        currentTweet = mediaTweets[0];
    }
    else {
        print("Error: no mediaTweets on current column");
    }
}

function mediaLinkElem (tweet) {
    let elem = tweet.querySelector("a.media-item");
    if (!elem) {
            elem = tweet.querySelector("a.media-image");
    }
    return elem;
}

function showCurrentTweet () {
    let current = getCurrentTweet();
    let linkElem = mediaLinkElem(current);
    if (linkElem) {
        //linkElem.scrollIntoView(false);
        linkElem.click();
    }
}

function findIndexMediaTweet(arr, tweet) {
    return arr.findIndex(x => {
        let elem1 = mediaLinkElem(x);
        let elem2 = mediaLinkElem(tweet);
        return elem1 && elem2 && elem1.href == elem2.href;
    });
}

function currentTweetLost(mediaTweets, current){
    console.log("Error: currentTweet lost. This is probably due to it being unloaded as the script scrolls down without being able to find media posts. Resetting value to first visible media post.");
    console.log("Lost tweet:", current);
    console.log("Visible media tweets:", mediaTweets);
    currentTweet = mediaTweets[0];
    showCurrentTweet();
}

function showNextTweet () {
    let current = getCurrentTweet();
    let mediaTweets = gatherMediaTweets();
    let index = findIndexMediaTweet(mediaTweets, current);
    if (index == -1) {
        currentTweetLost(mediaTweets, current);
        return;
    }
    if (index < mediaTweets.length - 1) {
       currentTweet = mediaTweets[index + 1]
       showCurrentTweet();
    }
    // atempts to load more even if it's not the last
    if (index + 1 >= mediaTweets.length - preemptiveLoad) {
        loadNextTweets();
    }
}

function showPreviousTweet () {
    let current = getCurrentTweet();
    let mediaTweets = gatherMediaTweets();
    let index = findIndexMediaTweet(mediaTweets, current);
    if (index == -1) {
        currentTweetLost(mediaTweets, current);
        return;
    }
    if (index >= 1) {
       currentTweet = mediaTweets[index - 1]
       showCurrentTweet();
    }
    if (index - 1 <= preemptiveLoad) {
        loadPrevTweets();
    }
}

function setCurrentColumn (colNumber) {
    currentColumn = colNumber;
    resetCurrentTweet();
}


function doc_keyUp(e) {
    let x = e.keyCode;
    if (x >= 49 && x <= 57){
            // numbers
            setCurrentColumn(x - 48);
    }
    switch (x) {
        case 74:
            showNextTweet();
            break;
        case 75:
            showPreviousTweet();
            break;
        default:
            break;
    }
}

doOnceLoaded("div#open-modal", setAutoplay);
document.addEventListener('keyup', doc_keyUp, false);
