import https from 'https';

https.get('https://wllzampbvrouiskrgaza.supabase.co/storage/v1/object/public/avatars/posters/1778133015891_556.png', (res) => {
  const chunks: Buffer[] = [];
  res.on('data', (chunk) => chunks.push(chunk));
  res.on('end', () => {
    const buffer = Buffer.concat(chunks);
    // Simple check for PNG dimensions
    if (buffer.toString('hex', 0, 8) === '89504e470d0a1a0a') {
      const width = buffer.readUInt32BE(16);
      const height = buffer.readUInt32BE(20);
      console.log(`Width: ${width}, Height: ${height}`);
    } else {
      console.log('Not a PNG');
    }
  });
});
