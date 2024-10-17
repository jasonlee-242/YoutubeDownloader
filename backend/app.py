from flask import Flask, request, Response
import os
from yt_dlp import YoutubeDL
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins="*")

# https://github.com/yt-dlp/yt-dlp?tab=readme-ov-file
# https://www.reddit.com/r/webdev/comments/1e9ug2s/where_to_host_my_backend_for_free/

# Function to generate settings based on file format
def get_ydl_opts(file_format, file_path):

    # Base settings
    settings = {
        'quiet': True,
        'no_warnings': True,
        'no-playlist': True,
        'outtmpl': file_path,
    }

    if file_format == 'mp4':
        settings.update({
            'format': 'bestvideo[ext=mp4][vcodec^=avc1]+bestaudio[ext=m4a]/best[ext=mp4][vcodec^=avc1]/best',
            'merge_output_format': 'mp4',
            'postprocessors': [{
                'key': 'FFmpegVideoConvertor',
                'preferedformat': 'mp4',
            }, {
                'key': 'FFmpegMetadata',
                'add_metadata': True,
            }],
        })
    elif file_format == 'mp3':
        settings.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }, {
                'key': 'FFmpegMetadata',
                'add_metadata': True,
            }],
        })
    else:
        raise ValueError(f"Unsupported file format: {file_format}")
    
    return settings

@app.route('/download-video', methods=['POST'])
def download_video():

    if request.method == 'OPTIONS':
        return '',  200

    data = request.json
    youtube_link = data.get('youtubeLink')
    file_format = data.get('fileFormat', 'mp4')  # Default to mp4 if no format is specified
    file_name = data.get('fileName', 'myfile')

     # Set up a temporary file path to save the video
    download_folder = '/tmp'  # Or any directory where you have write access
    file_path = os.path.join(download_folder, file_name)

    # yt-dlp options to save the video file
    ydl_opts = get_ydl_opts(file_format, file_path)

    # Function to generate video content
    def generate():
        with YoutubeDL(ydl_opts) as ydl:
            ydl.download([youtube_link])

        # Stream the video file from disk
        with open(file_path+'.'+file_format, 'rb') as f:
            while chunk := f.read(8192):  # Stream in chunks
                yield chunk

        # Optionally, delete the file after streaming
        os.remove(file_path+'.'+file_format)

   # Determine the correct MIME type based on the file format
    if file_format == 'mp4':
        mime_type = 'video/mp4'
    elif file_format == 'mp3':
        mime_type = 'audio/mpeg'
    else:
        raise ValueError(f"Unsupported file format: {file_format}")

    content_type = f"video/mp4" if file_format == "mp4" else "audio/mpeg"

    headers = {
        'Content-Disposition': f'attachment; filename="{file_name}.{file_format}"',
        'Content-Type': content_type,
    }

    # Create the response with the correct MIME type and Content-Disposition header
    response = Response(generate(), mimetype=mime_type, headers=headers)
    response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'
    response.headers['Access-Control-Allow-Origin'] = '*'

    return response

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)