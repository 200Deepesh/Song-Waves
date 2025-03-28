console.log("lets start");
let songs;
let uniqe = 256;
let songlist;
let currentSong;
let playPromise;
let currentAudioElement = new Audio();
let volume = 1;
let currentFlow = "ordered";

function transformTime(seconds) {
    if (isNaN(seconds)) {
        return "00:00";
    }
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

function playPauseAnimation(id) {
    let elements = Array.from(document.getElementById(id).getElementsByClassName("line"));
    if (elements[0].classList.length > 1) {
        for (const e of elements) {
            e.classList.remove("line" + (elements.indexOf(e) + 1));
        }
    }
    else {
        for (const e of elements) {
            e.classList.add("line" + (elements.indexOf(e) + 1));
        }
    }
    //    document.getElementsByClassName("containor")[0].getElementsByClassName("dot")[0].classList.remove(dot1);
}



async function displayPlaylists() {
    // let fetchFolders = await fetch("http://127.0.0.1:5500/songs");
    let fetchFolders = await fetch("https://raw.githubusercontent.com/200Deepesh/Song-Waves/tree/main/songs");
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
            for (playlist of playlists) {
                if (playlist.href.includes(folder.href + "/")) {
                    let jsonFile = await fetch(playlist.href + "/metadata.json");
                    let json = await jsonFile.text();
                    let metaData = JSON.parse(json);
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
                    document.getElementById(`${folder.title}`).insertAdjacentHTML("beforeend", playlistCard);
                }
            }
        }
    }
}

async function getSongs(folder, playlist) {
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
            let songInfo = link.split("/")[link.split("/").length - 1].slice(0, -4).replaceAll("%20", " ");
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
        songCard.innerHTML = `<div id="${id}" class="song-cards arial-font flex border light-background round-border white-font p-10 aline">
        <div class="dp aline semicircle-border border flex dark-background">
            <img src="svg-collection/playbar/playlist-02-stroke-rounded.svg" alt="">
        </div>
        <div class="info">
        <div class="song-name bold overflow">${songName}</div>
        <div class="artist-name overflow">${artistName}</div>
        </div>
        <div class="play-btn aline cursor-pointer">
    
            <div class="animation">
                            <div class="line"></div>
                            <div class="line"></div>
                            <div class="line"></div>
                            <div class="line"></div>
            </div>
        </div>
        </div>`;
        box.insertAdjacentElement("beforeend", songCard);
        let element = document.getElementById(song);
        element.addEventListener("click", () => {
            playPause(currentSong);
            playPause(song);
        })
    }

}

async function addEvent() {
    // ADD EVENT LISTENER TO CURRENT AUDIO ELEMENT
    currentAudioElement.addEventListener("timeupdate", () => {
        let currentTime = document.getElementById("current-time");
        let duration = document.getElementById("duration");
        currentTime.innerHTML = transformTime(currentAudioElement.currentTime);
        duration.innerHTML = transformTime(currentAudioElement.duration);
        // console.log("scale",(document.getElementById("point").style.scale == "" || document.getElementById("point").style.scale == 1))
        if((document.getElementById("point").style.scale == "" || document.getElementById("point").style.scale == 1)){
            document.getElementById("point").style.left = (currentAudioElement.currentTime / currentAudioElement.duration) * 100 + "%";
        }
        
    });
    currentAudioElement.addEventListener("ended", (resolve) => {
        setTimeout(() => {
            let element = document.getElementById(currentSong);
            element.src = "svg-collection/playbar/play-circle-02-stroke-rounded.svg";
            playPauseAnimation(currentSong);
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
    let pointPos = 0;
    const seekbar = document.getElementById("seek-bar");
    const point = document.getElementById("point");
    point.addEventListener("mousedown", (e) => {
        e.preventDefault()
        point.style.scale = 1.2;
        document.onmouseup = (e) => {
            document.onmouseup = null;
            document.onmousemove = null;
            point.style.scale = 1;
            let offset = (point.offsetLeft + 5) / seekbar.offsetWidth;
            currentAudioElement.currentTime = currentAudioElement.duration * offset;
        }
        document.onmousemove = (e) => {
            e.preventDefault();
            let barwidth = seekbar.offsetWidth;
            pointPos = e.clientX - seekbar.getBoundingClientRect().left;
            if (pointPos <= 0) {
                pointPos = 0;
            }
            else if (pointPos >= barwidth) {
                pointPos = barwidth;
            }
            point.style.left = pointPos - 5 + "px";
        }
    })

    // ADDING EVENT LISTENER TO VOLUME-BAR
    const volumebar = document.getElementById("volume-bar");
    const volumePoint = document.getElementById("volume-point");
    let volumePointPos = 0;
    volumePoint.addEventListener("mousedown", (e) => {
        e.preventDefault()
        volumePoint.style.scale = 1.2;
        document.onmouseup = (e) => {
            document.onmouseup = null;
            document.onmousemove = null;
            volumePoint.style.scale = 1;
            volume = (volumePoint.offsetLeft+7)/volumebar.offsetWidth;
            if(volume >= 1){
                volume = 1;
            }
            else if(volume <= 0){
                volume = 0;
            }
            currentAudioElement.volume = volume;
            document.getElementById("volume-value").innerHTML = volume*100- volume*100%1;
        }
        document.onmousemove = (e) => {
            e.preventDefault();
            let barwidth = volumebar.offsetWidth;
            volumePointPos = -(e.clientX - volumebar.getBoundingClientRect().right);
            if (volumePointPos <= 0) {
                volumePointPos = 0;
            }
            else if (volumePointPos >= barwidth) {
                volumePointPos = barwidth;
            }
            volumePoint.style.right = volumePointPos - 5 + "px";
        }
    })
    

    // ADD EVENT LISTENER TO VOLUME BUTTON 
    const volumeBtn = document.querySelector("#volume-svg > img");
    volumeBtn.addEventListener("click", (event) => {
        const volumebox = document.getElementById("volume-box");
        if (!volumebox.style.zIndex) {
            volumebox.style.zIndex = "2";
        }
        else {
            volumebox.style.zIndex = "";
        }
    })

    // ADD EVENT LISTENER TO MUTE BUTTON 
    const muteBtn = document.querySelector("#mute-btn > img");
    muteBtn.addEventListener("click", (event) => {
        if (currentAudioElement.muted) {
            currentAudioElement.muted = false;
            event.currentTarget.src = "svg-collection/playbar/mic-01-stroke-rounded.svg"
        }
        else {
            currentAudioElement.muted = true;
            event.currentTarget.src = "svg-collection/playbar/mic-off-01-stroke-rounded.svg"
        }
    })

    const flowBtn = document.getElementById("flow-svg");
    flow.addEventListener("click", (event) => {
        // const flow = flowBtn.dataset.flow;
        if (currentFlow == "ordered") {
            currentFlow = "shuffle";
            flowBtn.src = "svg-collection/playbar/shuffle-stroke-rounded.svg";
        }
        else if (currentFlow == "shuffle") {
            currentFlow = "loop";
            flowBtn.src = "svg-collection/playbar/arrow-reload-horizontal-stroke-rounded.svg";
            currentAudioElement.loop = true;
        }
        else {
            currentFlow = "ordered";
            flowBtn.src = "svg-collection/playbar/left-to-right-list-dash-stroke-rounded.svg";
            currentAudioElement.loop = false;
        }
        console.log(currentFlow);
    })
}

function playNextSong(id, event) {
    if (!currentAudioElement.paused) {
        playPause(id);
    }
    if (currentFlow == "shuffle") {
        let random = Math.round(Math.random() * (songlist.length - 1));
        if (songlist[songlist.indexOf(id)] == songlist[random]) {
            if (songlist.indexOf(id) == songlist.length - 1) {
                id = songlist[0];
            }
            else {
                let nextSong = songlist[songlist.indexOf(id) + 1];
                id = nextSong;
            }
            console.log(random);
            console.log("repeat");
        }
        else {
            id = songlist[random];
        }
    }
    else {
        if (songlist.indexOf(id) == songlist.length - 1) {
            id = songlist[0];
        }
        else {
            let nextSong = songlist[songlist.indexOf(id) + 1];
            id = nextSong;
        }
    }
    playPause(id.toString());
}

async function playPause(id, event) {
    // console.log(id, "playPause");
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
        currentAudioElement.volume = volume;
        document.getElementById("left-middle").scrollTop = element.offsetTop;
        playPauseAnimation(id);
        playPromise = await currentAudioElement.play();
        element.src = "svg-collection/playbar/pause-circle-stroke-rounded.svg";
        element.alt = "pause";
        playbtn.src = "svg-collection/playbar/pause-circle-stroke-rounded.svg";
    }
    else {
        currentAudioElement.pause();
        // element.src = "svg-collection/playbar/play-circle-02-stroke-rounded.svg";
        playPauseAnimation(id);
        // element.alt = "play";
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
            await getSongs(folder, playlist);
            await displaySongs(songlist);
            let playbar = document.getElementById("playbar");
            playbar.style.bottom = 0;
            document.getElementById("right-body").style.height = "calc(100% - 45px - 5rem)"
            playPause(currentSong);

        })
    }
    await addEvent(songlist);

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






