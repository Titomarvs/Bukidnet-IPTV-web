    // HLS/YouTube Player
    var video = document.getElementById("videoPlayer");
    var iframe = document.getElementById("videoFrame");
    var hls = null;

    // Initialize Shaka Player
    const shakaVideo = document.getElementById('shakaPlayer');
    const shakaPlayer = new shaka.Player(shakaVideo);

    // Load channels into the sidebar
    function loadChannels() {
        const channelsContainer = document.getElementById('combinedChannels');
        channelsContainer.innerHTML = '';
        
        combinedChannels.forEach((channel, index) => {
            const button = document.createElement('div');
            button.className = 'channel';
            button.textContent = channel.name;
            button.addEventListener('click', () => playChannel(channel));
            channelsContainer.appendChild(button);
        });
    }

    // Play a channel
    function playChannel(channel) {
        stopAllPlayers();
        
        if (channel.type === 'youtube') {
            iframe.style.display = "block";
            video.style.display = "none";
            document.getElementById("shakaContainer").style.display = "none";
            iframe.src = channel.url.replace("autoplay=1", "autoplay=0");
        } 
        else if (channel.type === 'hls') {
            iframe.style.display = "none";
            video.style.display = "block";
            document.getElementById("shakaContainer").style.display = "none";

            if (Hls.isSupported()) {
                if (hls) {
                    hls.destroy();
                }
                hls = new Hls();
                hls.loadSource(channel.url);
                hls.attachMedia(video);
                hls.on(Hls.Events.MANIFEST_PARSED, function() {
                    video.play();
                });
            } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = channel.url;
                video.play();
            }
        }
        else if (channel.type === 'dash') {
            iframe.style.display = "none";
            video.style.display = "none";
            document.getElementById("shakaContainer").style.display = "flex";
            
            try {
                if (channel.clearKey) {
                    shakaPlayer.configure({
                        drm: {
                            clearKeys: channel.clearKey
                        }
                    });
                }

                shakaPlayer.configure({
                    streaming: {
                        bufferingGoal: 60,
                        rebufferingGoal: 2,
                        bufferBehind: 30,
                        ignoreTextStreamFailures: true
                    },
                    abr: {
                        enabled: true,
                        defaultBandwidthEstimate: 500000
                    }
                });

                shakaPlayer.load(channel.url).then(() => {
                    shakaVideo.play();
                });
                
                shakaVideo.style.display = 'block';
                shakaVideo.style.backgroundColor = '#000';
                
            } catch (error) {
                console.error('Error loading DASH stream:', error);
                alert('Error loading video: ' + error.message);
            }
        }
    }

    // Stop all players
    function stopAllPlayers() {
        // Stop HLS player
        if (hls) {
            hls.destroy();
            hls = null;
        }
        
        // Stop HTML5 video
        if (video) {
            video.pause();
            video.removeAttribute('src');
            video.load();
        }
        
        // Stop YouTube iframe
        if (iframe) {
            iframe.src = '';
        }
        
        // Stop Shaka Player
        if (shakaPlayer) {
            shakaPlayer.unload();
        }
    }

    // Initialize the app
    document.addEventListener('DOMContentLoaded', async () => {
        // Initialize Shaka Player
        await shaka.polyfill.installAll();
        
        if (!shaka.Player.isBrowserSupported()) {
            console.error('Browser not supported for Shaka Player');
            alert('Your browser does not support the required video playback features');
        } else {
            console.log('Shaka Player is supported');
            loadChannels();
        }
    });

    document.getElementById("sidebarToggle").addEventListener("click", function() {
        document.getElementById("sidebar").classList.toggle("active");
    });
    