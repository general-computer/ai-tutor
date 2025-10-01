base64 -d -i audio.txt | ffmpeg -i pipe:0 -c:a aac output.mp4

