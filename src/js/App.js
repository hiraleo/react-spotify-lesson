import React, { Component } from 'react';
import 'reset-css/reset.css';
import '../css/App.css';
import queryString from 'query-string';


let defaultStyle = {
  color: '#424242',
  'font-family': 'Futura',
};



let counterStyle = {
  ...defaultStyle, 
  // width: '100%', 
  // 'margin-bottom': '10px',
  'margin-right': '10px',
  // 'font-size': '20px',
  // 'font-height': '30px',
}

function isOdd(number) {
 return number % 2
}

// PLAYLIST COUNT
class PlaylistCounter extends Component {
  render() {

    return (
      <div style={counterStyle}>
        <h2>{this.props.playlists && this.props.playlists.length} playlists</h2>
      </div>
    );
  }
}

// SONG DURATION
class HoursCounter extends Component {
  render() {

    let allSongs = this.props.playlists.reduce((songs, eachPlaylist) => {
      return songs.concat(eachPlaylist.songs)
    }, [])

    let totalDuration = allSongs.reduce((sum, eachSong) => {
      return sum += eachSong.duration
    }, 0)

    let totalDurationHours = Math.round(totalDuration/60)

    let isTooLow = totalDurationHours < 40

    let hoursCounterStyle = {
      ...counterStyle,
      color: isTooLow ? 'red' : '#424242',
      'font-weight': isTooLow ? 'light' : 'medium'
    }

    return (
      <div style={hoursCounterStyle}>
        <h2> {totalDurationHours} hours</h2>
      </div>
    );
  }
}

// FILTER COMPONENT
class Filter extends Component {
  render() {
    return (
      <div style={defaultStyle}>
        <img />
        <input type='text' placeholder="Search" onKeyUp={(event) => 
          this.props.onTextChange(event.target.value)} style={{
            ...defaultStyle,
            color: 'balck',
            'font-size': '14px',
            'margin-left': '20px'
            // padding: '4px'
          }}/>
      </div>
    );
  }
}

// PLAYLIST COMPONENT
class PlayList extends Component {
  render() {
    let playlist = this.props.playlist
        
    return (
      <div style={{
        ...defaultStyle,
        width: '100%',
        display:'flex',
        'flex-direction': 'column',
        // 'align-items': 'center',
        margin: '10px 10px',
        width: '20%',
        padding: '8px',
        'text-align': 'left',
        'color': '#424242', 
        'background-color': 'white'
        //  'background-color': isOdd(this.props.index) 
        //     ? '#C0C0C0'
        //     : '#808080'
        }}>

        <h2 style={{margin: '5px 0'}}>{playlist.name}</h2>

        <a href={playlist.URL} target="_blank">
          <img className="playlistImage" src={playlist.imageURL} style={{
            width: '100%',  
            'cursor': 'pointer'
            }}/>
        </a>
        <ul style={{
          'font-size': '14px', 
          'margin-top': '10px', 
          'margin-left': '18px',
          'text-align': 'left',
          'list-style': 'circle',
          'opacity': '0.6'
          }}>
          {
            playlist.songs.map(song => 
              <li style={{'padding-top': '2px'}}>{song.name}</li>,
            )
          }
        </ul>
      </div>
    );
  }
}

// MAIN APP COMPONENT 
class App extends Component {

  // state
  constructor() {
    super()
    this.state = {
      serverData: {},
      filterString: ''
    }
  }

  componentDidMount() {

    let parsed = queryString.parse(window.location.search)
    let accessToken = parsed.access_token

    if (!accessToken) return null;

    // User name
    fetch('https://api.spotify.com/v1/me', {
      headers: {'Authorization': 'Bearer ' + accessToken}
    }).then((response) => response.json())
      .then(data => this.setState({
        user: {
          name: data.id
        }
      }))
      
    fetch('https://api.spotify.com/v1/me/playlists', {
      headers: {'Authorization': 'Bearer ' + accessToken}
    }).then((response) => response.json())
      .then(playlistData => {
        let playlists = playlistData.items
        let trackDataPromises = 
          playlists.map(playlist => {
            let responsePromise = fetch(playlist.tracks.href, {
              headers: {'Authorization': 'Bearer ' + accessToken}
            })
            let trackDataPromise = responsePromise
              .then(response => response.json())
            return trackDataPromise
        })

      let allTracksDataPromises = Promise.all(trackDataPromises)

      let playlistsPromise =  allTracksDataPromises.then(trackDatas => { 
        trackDatas.forEach((trackData, i) => {
            playlists[i].trackDatas = trackData.items
              .map(item => item.track)
              .map(trackData => ({
                name: trackData.name,
                duration: trackData.duration_ms / 1000
              }))
          })
          return playlists
        })
        return playlistsPromise
    })


        .then(playlists => this.setState({
          playlists: 
            playlists.map(item => {
              console.log(item.trackDatas);
              return {
                name: item.name, 
                imageURL: item.images[0].url,
                songs: item.trackDatas.slice(0,3).map(trackData => ({
                  name: trackData.name,
                  duration: trackData.duration
                })),
                URL: item.external_urls.spotify
            }
          })
      }))
  }

  render() {

    let playlistToRender = 
          this.state.user && 
          this.state.playlists 
        ? this.state.playlists.filter(playlist => {
            let matchesPlaylist = playlist.name
              .toLowerCase()
              .includes(
                this.state.filterString
                .toLowerCase()
              )

              let matchesSong = playlist.songs
                .find(song => song.name
                  .toLowerCase()
                  .includes(this.state.filterString
                    .toLowerCase()
                ))

             return matchesPlaylist || matchesSong
          }) 
        : []

    return (
      <div className="App">

        {/* userデータが存在していた場合のみdivタグを描画する */}
        {
          this.state.user 
          ? <div>

            <div className="headerContent">
            
              <div className="searchContent">
                <h1 style={{
                  ...defaultStyle, 
                  'font-size': '24px', 
                  'margin': '0 10px',
                }}>
                  My Spotify Playlists
                </h1>

                <Filter onTextChange={text => this.setState({filterString: text})}/>
              </div>

              <div className="counterContent">
                <PlaylistCounter playlists={playlistToRender} />
                <HoursCounter playlists={playlistToRender}/>
              </div>

            </div>

            <div className="playlist">{
              playlistToRender.map((playlist, i) => 
                <PlayList playlist={playlist} index={i}/>
            )}</div>

           </div> 

          // ログイン
          : <button onClick={() => {
              window.location = 
              window.location.href.includes('localhost') 
            ? 'http://localhost:8888/login'
            : 'https://lanohe-react-playlist-backend.herokuapp.com/login'}}

            style={{
              padding: '20px', 
              'font-size': '30px', 
              'margin': '20px',
            }}>
              Sign in with Spotify 
          </button>
        }
      </div>
    );
  }
}

export default App;
