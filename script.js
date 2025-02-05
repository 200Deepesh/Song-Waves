console.log("lets start");
let songs;
let uniqe = 256;
let songlist;
let currentSong;
let playPromise;
let currentAudioElement = new Audio();
let voluem = 1;

function transformTime(seconds) {
    let time = seconds - seconds % 1;
    let min = (time - time % 60) / 60;
    let sec = time % 60;
    if (sec < 10) {
        return `${min}:0${sec}`;
    }
    else {
        return `${min}:${sec}`;
    }
}

async function displayPlaylists() {
    let fetchFolders = await fetch("http://127.0.0.1:5500/songs");
    let r1 = await fetchFolders.text();
    let div = document.createElement("div");
    div.innerHTML = r1;
    let folders = div.getElementsByTagName("a");
    for (const folder of folders) {
        if (folder.href.includes("/songs/")) {
            let fetchPlaylist = await fetch(folder.href);
            let r2 = await fetchPlaylist.text();
            let div = document.createElement("div");
            div.innerHTML = r2;
            let playlists = div.getElementsByTagName("a");
            for(playlist of playlists) {
                if(playlist.href.includes(folder.href+"/")) {
                    let jsonFile = await fetch(playlist.href + "/metadata.json");
                    let json = await jsonFile.text();
                    let metaData = JSON.parse(json);
                    console.log(JSON.parse(json));
                    let playlistCard = `
                                <div data-playlist="${playlist.title}" class="card border round-border cursor-pointer">
                                    <div class="pic border semicircle-border m-10">
                                        <img id="face-holder" class="semicircle-border" src="${metaData.faceCover}" alt="">
                                        <div id="hover" class="p-10 semicircle-border border">
                                            <img src="svg-collection/right-main-svg/play.svg" alt="">
                                        </div>
                                    </div>
                                    <div class="name border white-font m-10">${metaData.title}</div>
                                    <div class="grey-font small m-10">${metaData.discription}</div>
                                </div>`;
                                console.log(folder.title);
                    document.getElementById(`${folder.title}`).insertAdjacentHTML("beforeend", playlistCard);
                }
            }
        }
    }
}

async function getSongs(folder,playlist) {
    songs = {};
    songlist = [];
    let a = await fetch(`http://127.0.0.1:5500/songs/${folder}/${playlist}`);
    let response = await a.text();
    let div = document.createElement("div");
    div.innerHTML = response;
    let elements = div.getElementsByTagName("a");
    for (const element of elements) {
        if (element.href.endsWith(".mp3")) {
            let id = uniqe.toString(16);
            let link = element.href;
            let songInfo = link.split("/")[link.split("/").length - 1].slice(0, -4).replaceAll("%20"," ");
            let artist = "Artist";
            songs[id] = {
                id: id,
                url: link,
                name: songInfo,
                artist: artist,
            }
            songlist.push(id);
            uniqe += 1;
        }
        console.log(element);
    }
    currentSong = songlist[0];
    currentAudioElement.src = songs[currentSong].url;
}

async function displaySongs() {
    let songlist = arguments[0];
    let box = document.getElementById("left-middle");
    box.innerHTML = "";
    for (const song of songlist) {
        let songCard = document.createElement("div");
        let songName = songs[song].name;
        let artistName = songs[song].artist;
        let id = songs[song].id;
        songCard.innerHTML = `<div class="song-cards arial-font flex border light-background round-border white-font p-10 aline">
        <div class="dp aline semicircle-border border flex dark-background">
            <img src="svg-collection/playbar/playlist-02-stroke-rounded.svg" alt="">
        </div>
        <div class="info">
        <div class="line1 bold overflow">${songName}</div>
        <div class="line2 overflow">${artistName}</div>
        </div>
        <div class="play-btn aline cursor-pointer">
            <img id="${id}" src="svg-collection/playbar/play-circle-02-stroke-rounded.svg" alt="play">
        </div>
        </div>`;
        box.insertAdjacentElement("afterbegin", songCard);
    }
}

async function addEvent() {
    let songlist = arguments[0];
    for (const song of songlist) {
        let element = document.getElementById(song);
        element.addEventListener("click", playPause.bind(null, song));
    }

    // ADD EVENT LISTENER TO CURRENT AUDIO ELEMENT
    currentAudioElement.addEventListener("timeupdate", () => {
        // console.log(transformTime( "current time:",myAudioElement.currentTime))
        let currentTime = document.getElementById("current-time");
        let duration = document.getElementById("duration");
        currentTime.innerHTML = transformTime(currentAudioElement.currentTime);
        duration.innerHTML = transformTime(currentAudioElement.duration);
        document.getElementById("point").style.left = (currentAudioElement.currentTime / currentAudioElement.duration) * 100 + "%";
    });
    currentAudioElement.addEventListener("ended", (resolve) => {
        setTimeout(() => {
            playNextSong(currentSong);
        }, 2000
        )
        return resolve;
    })

    // ADDING EVENT LISTENER TO NEXT-BUTTON
    const next = document.getElementById("next");
    next.addEventListener("click", (event) => {
        playNextSong(currentSong);
    });

    // ADDING EVENT LISTENER TO PREVIOUS-BUTTON
    const previous = document.getElementById("previous");
    previous.addEventListener("click", (event) => {
        if (!currentAudioElement.paused) {
            playPause(currentSong);
        }
        let id;
        if (songlist.indexOf(currentSong) == 0) {
            id = songlist[songlist.length - 1]
        }
        else {
            let previousSong = songlist[songlist.indexOf(currentSong) - 1];
            id = previousSong;
        }
        playPause(id);
    });

    // ADDING EVENT LISTENER TO SEEK-BAR
    const seekbar = document.getElementById("seek-bar");
    seekbar.addEventListener("click", (event) => {
        let point = document.getElementById("point");
        let offset = (event.offsetX / seekbar.clientWidth);
        point.style.left = offset * 100 + "%";
        currentAudioElement.currentTime = currentAudioElement.duration * offset;
    })

    // ADDING EVENT LISTENER TO VOLUME-BAR
    const volumebar = document.getElementById("volume-bar");
    volumebar.addEventListener("click", (event) => {
        let point = document.getElementById("volume-point");
        let offset = (event.offsetX / volumebar.clientWidth);
        if (offset > 1) {
            offset = 1;
        }
        else if (offset < 0) {
            offset = 0;
        }
        point.style.right = ((1 - offset) * 100) + "%";
        voluem = offset;
        currentAudioElement.volume = voluem;
        document.getElementById("volume-value").innerHTML = (offset * 100) - (offset * 100) % 1;
    })

    
    const volumeBtn = document.querySelector("#volume-svg > img");
    volumeBtn.addEventListener("click", (event) => {
        if (currentAudioElement.muted) {
            currentAudioElement.muted = false;
        }
        else {
            currentAudioElement.muted = true;
        }
        const volumebox = document.getElementById("volume-box");
        if (!volumebox.style.zIndex) {
            volumebox.style.zIndex = "2";
        }
        else {
            volumebox.style.zIndex = "";
        }
        console.log(currentAudioElement.volume);
    })
}

function playNextSong(id, event) {
    if (!currentAudioElement.paused) {
        playPause(id);
    }
    if (songlist.indexOf(id) == songlist.length - 1) {
        id = songlist[0];
    }
    else {
        let nextSong = songlist[songlist.indexOf(id) + 1];
        id = nextSong;
    }
    console.log(id);
    playPause(id.toString());
}

function displayPlaybar() {
    
}

async function playPause(id, event) {
    const element = document.getElementById(id);
    
    const info = document.getElementById("playbar-info").getElementsByTagName("div");
    const playbtn = document.getElementById("play");
    info[0].innerHTML = songs[id].name;
    info[1].innerHTML = songs[id].artist;
    if (currentAudioElement.paused) {
        if (currentSong != id) {
            currentAudioElement.src = songs[id].url;
            currentSong = id;
        }
        currentAudioElement.volume = voluem;
        document.getElementById(currentSong).src = "svg-collection/playbar/play-circle-02-stroke-rounded.svg";
        playPromise = await currentAudioElement.play();
        element.src = "svg-collection/playbar/pause-circle-stroke-rounded.svg";
        element.alt = "pause";
        playbtn.src = "svg-collection/playbar/pause-circle-stroke-rounded.svg";
    }
    else {
        currentAudioElement.pause();
        element.src = "svg-collection/playbar/play-circle-02-stroke-rounded.svg";
        element.alt = "play";
        playbtn.src = "svg-collection/playbar/play-circle-02-stroke-rounded.svg";
    }
}


async function main() {
    await displayPlaylists();
    const cards = document.getElementsByClassName("card");
    for (const e of cards) {
        
        e.addEventListener("mouseover", (event) => {
            event.currentTarget.style = "background: #1f1f1f;";
            let hover = e.querySelector("#hover");
            hover.style.opacity = "1";
            hover.style.bottom = "0";
        })
        
        e.addEventListener("mouseout", (event) => {
            event.currentTarget.style = "";
            let hover = e.querySelector("#hover");
            hover.style.opacity = "";
            hover.style.bottom = "";
        })
        
        e.addEventListener("click", async (event) => {
            if (currentAudioElement) {
                currentAudioElement.pause();
            }
            const playlist = event.currentTarget.dataset.playlist;
            const folder = event.currentTarget.parentElement.dataset.folder;
            console.log(folder);
            await getSongs(folder, playlist);
            await displaySongs(songlist);
            await addEvent(songlist);
            let playbar = document.getElementById("playbar");
            playbar.style.bottom = 0;
            document.getElementById("right-body").style.height = "calc(100% - 45px - 5rem)"
            playPause(currentSong);
        })
    }
    // ADDING EVENT LISTENER TO SIDE-BAR
    const sidebar = document.getElementById("side-bar");
    sidebar.addEventListener("click", (event) => {
        let left = document.getElementById("left");
        left.style.left = 0;
    })
    
    // ADDING EVENT LISTENER TO CANCLE BUTTON 
    const cancle = document.getElementById("cancle-svg");
    cancle.addEventListener("click", (event) => {
        let left = document.getElementById("left");
        left.style.left = "-200%";
    })
}

main();






