
import React, { useEffect, useState, useRef } from 'react';
import ReactPlayer from 'react-player';

export default function VideoView({ jobId }){
  const [data, setData] = useState(null);
  const playerRef = useRef();

  useEffect(()=>{
    // Demo: load a sample video metadata
    const demo = {
      title: 'Demo video',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      scenes: [
        { id:'s1', start:0, end:12, thumbnail:null, summary:{tldr:'Intro', bullets:['a','b','c']} },
        { id:'s2', start:12, end:28, thumbnail:null, summary:{tldr:'Middle', bullets:['x','y','z']} }
      ]
    };
    setData(demo);
  }, [jobId]);

  if(!data) return <div>Loading...</div>;

  return (
    <div className="container">
      <div className="left">
        <h3>{data.title}</h3>
        <div style={{background:'#000'}}>
          <ReactPlayer ref={playerRef} url={data.url} controls width="100%" height="360px" />
        </div>
        <div className="timeline">
          {data.scenes.map(s => (
            <div key={s.id} onClick={()=> playerRef.current.seekTo(s.start, 'seconds')} style={{minWidth:140}}>
              <img className="thumbnail" src={s.thumbnail || 'https://via.placeholder.com/160x90.png?text=thumb'} alt="" />
              <div style={{fontSize:12}}>{s.summary.tldr}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="right">
        <h4>Scenes</h4>
        {data.scenes.map(s=> (
          <div key={s.id} style={{marginBottom:12}}>
            <strong>{s.summary.tldr}</strong>
            <ul>
              {s.summary.bullets.map((b,i)=><li key={i}>{b}</li>)}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
