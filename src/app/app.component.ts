import { Component, NgZone, OnInit } from '@angular/core';
import { APPService } from './app.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})



export class AppComponent implements OnInit {
  title = 'ytq';
  showVideo = true;
  /* 1. Some required variables which will be used by YT API*/
  public YT: any;
  public video: any;
  public player: any;

  public isPlaying = false;
  public isQueueOpen = false;

  public isSearching = false;


  public q: string = '';

  currentPlayTime = 0;
  currentTotalTime = 0;
  currentPlayTimeInterval: any;
  currentPlayTimeProgress = 0;

  isBlack = false;


  public currentPlay: videoData | null = null;
  public searchLists: videoData[] = [];

  public queueLists: videoData[] = [];



  isRestricted = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);


  constructor(private appService: APPService, private ngZone: NgZone) {
  }



  /* 2. Initialize method for YT IFrame API */
  async init() {
    // Return if Player is already created
    if (window['YT']) {
      this.startVideo();
      return;
    }
    // this.appService.search('ท้อ คาราโอเกะ').then(data => console.log(data));

    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode!.insertBefore(tag, firstScriptTag);

    /* 3. startVideo() will create an <iframe> (and YouTube player) after the API code downloads. */
    window['onYouTubeIframeAPIReady'] = () => this.startVideo();
  }

  ngOnInit() {

    console.log(this.currentPlay);

    this.video = '';
    this.init();
  }

  startVideo() {
    this.player = new window['YT'].Player('player', {
      videoId: null,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 0,
        modestbranding: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
      },
      events: {
        'onStateChange': this.onPlayerStateChange.bind(this),
        'onError': this.onPlayerError.bind(this),
        'onReady': this.onPlayerReady.bind(this),
      }
    });


  }

  onPlayerReady(event: any) {
    if (this.isRestricted) {
      // event.target.mute();
      event.target.playVideo();
    } else {
      event.target.playVideo();
    }
  }

  onPlayerStateChange(event: any) {
    console.log(event)
    switch (event.data) {
      case window['YT'].PlayerState.PLAYING:
        this.isPlaying = true;
        if (this.cleanCurrentTime() == 0) {
          console.log('started ' + this.cleanCurrentTime());
        } else {
          console.log('playing ' + this.cleanCurrentTime())
        };
        break;
      case window['YT'].PlayerState.PAUSED:
        this.isPlaying = false;
        if (this.player.getDuration() - this.player.getCurrentTime() != 0) {
          console.log('paused' + ' @ ' + this.cleanCurrentTime());
        };
        break;
      case window['YT'].PlayerState.ENDED:
        console.log('ended ');
        this.runQueue();
        break;
    };
  };

  cleanCurrentTime() {
    return Math.round(this.player.getCurrentTime())
  };

  cleanTotleTime() {
    return Math.round(this.player.getDuration())
  };

  onPlayerError(event: any) {
    switch (event.data) {
      case 2:
        console.log('' + this.video)
        break;
      case 100:
        break;
      case 101 || 150:
        break;
    };
  };

  onPlayPause() {
    if(this.currentPlay !== null){
      this.onControlPlayer(this.isPlaying ? 'pause' : 'play');
      this.isPlaying = !this.isPlaying;
    }
  }

  onControlPlayer(action: string) {
    switch (action) {
      case 'play': {
        this.player.playVideo();
      }; break;
      case 'pause': {
        this.player.pauseVideo();
      }; break;
      case 'stop': {
        this.player.stopVideo();
      }; break;
      case 'next': {
        this.runQueue()
      }; break;
    }
  }

  onSearch() {
    this.isSearching = true;
    this.appService.search(this.q).then(data => {
      if (!!data) {
        if (data.items.length > 0) {
          this.isSearching = false;
          this.searchLists = data.items;
        }
      }
    });
  }

  onSearchKaraoke() {
    this.isSearching = true;
    this.appService.search(this.q + ' คาราโอเกะ').then(data => {
      if (!!data) {
        if (data.items.length > 0) {
          this.isSearching = false;
          this.searchLists = data.items;
        }
      }
    });
  }

  addToQueue(video: videoData) {

    this.q = '';
    this.searchLists = [];

    if (this.currentPlay === null && this.queueLists.length === 0) {
      this.currentPlay = video;
      this.loadVideo(this.currentPlay);
      this.isPlaying = true;
    } else {
      this.queueLists.push(video)
    }

  }

  runQueue() {
    this.ngZone.run(() => {
      if (this.queueLists.length > 0) {
        this.currentPlay = JSON.parse(JSON.stringify(this.queueLists[0]));
        this.loadVideo(this.currentPlay);
        this.queueLists.shift()
        this.isPlaying = true;
      } else {
        clearInterval(this.currentPlayTimeInterval);
        this.currentPlayTime = 0;
        this.currentPlayTimeProgress = 0;
        this.currentTotalTime = 0;
        this.currentPlay = null;
        this.isPlaying = false;
        this.player.stopVideo();
      }
    })

  }


  loadVideo(video: videoData) {
    console.log(video);
    this.player.loadVideoById(video.id);
    clearInterval(this.currentPlayTimeInterval);
    this.currentPlayTime = 0;
    this.currentPlayTimeProgress = 0;
    this.currentTotalTime = 0;
    this.currentPlayTimeInterval = setInterval(() => {
      this.currentTotalTime = this.cleanTotleTime();
      this.currentPlayTime = this.cleanCurrentTime();
      this.currentPlayTimeProgress = (this.player.getCurrentTime() / this.player.getDuration()) * 100
    }, 1000)
  }

  onSearchBoxBlur() {
    setTimeout(() => { this.isBlack = false; }, 300)
  }

  onReloadVideo() {
    if (this.currentPlay !== null) {
      this.loadVideo(this.currentPlay);
    }
  }

  onRemoveFromQueue(index: number) {
    this.queueLists.splice(index, 1)
  }

  // onToggleFullscreen() {
  //   const body: any = document.getElementsByTagName('body');
  //   console.log(body)
  //   if (this.isFullscreen === true) {
  //     if (body[0].exitFullscreen) {
  //       body[0].exitFullscreen();
  //     } else if (body[0].mozCancelFullScreen) {
  //       body[0].mozCancelFullScreen();
  //     } else if (body[0].webkitExitFullscreen) {
  //       body[0].webkitExitFullscreen();
  //     }
  //   } else {
  //     if (body[0].requestFullscreen) {
  //       body[0].requestFullscreen();
  //     } else if (body[0].webkitRequestFullscreen) { /* Safari */
  //       body[0].webkitRequestFullscreen();
  //     } else if (body[0].msRequestFullscreen) { /* IE11 */
  //       body[0].msRequestFullscreen();
  //     }
  //   }
  //   this.isFullscreen = !this.isFullscreen;

  // }

}


class videoData {
  id?: string;
  type?: string;
  thumbnail?: { thumbnails: { url: string, width: number, height: number }[] };
  title?: string;
  channelTitle?: string;
  length?: { simpleText: string };
}
