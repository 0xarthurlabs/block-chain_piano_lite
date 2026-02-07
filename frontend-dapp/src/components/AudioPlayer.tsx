import React from 'react';

export default function AudioPlayer({ src }: { src: string }) {

  if (!src) {
    return null;
  }
  
  return (
    <div className="my-2">
      {src ? <audio controls src={src} className="w-full">
        Your browser does't support audio element!
      </audio> : null}
    </div>
  );
}
