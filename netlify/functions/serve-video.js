const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { Readable } = require('stream');
const mime = require('mime-types');

// Fonction pour servir les vidéos générées temporairement
exports.handler = async function(event, context) {
  // Extraire le chemin de la vidéo à partir des paramètres de l'URL
  const videoId = event.path.split('/').pop();
  
  if (!videoId || !videoId.includes('video_')) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'ID vidéo invalide' })
    };
  }
  
  try {
    // Déterminer le type de contenu basé sur l'extension
    const contentType = mime.lookup(videoId) || 'video/mp4';
    
    // Dans une implémentation complète, nous stockerions la vidéo dans un bucket S3,
    // mais pour cet exemple, nous allons simuler une réponse réussie
    const mockVideoData = Buffer.from('Video simulée pour ' + videoId);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${videoId}"`,
        'Cache-Control': 'max-age=3600' // Cache d'une heure
      },
      body: mockVideoData.toString('base64'),
      isBase64Encoded: true
    };
    
    /* 
    // Exemple d'implémentation avec S3 pour une version future
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    });
    
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: `temp-videos/${videoId}`
    };
    
    const response = await s3Client.send(new GetObjectCommand(params));
    
    // Convertir le flux en buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': response.ContentType,
        'Content-Disposition': `inline; filename="${videoId}"`,
        'Cache-Control': 'max-age=3600' // Cache d'une heure
      },
      body: fileBuffer.toString('base64'),
      isBase64Encoded: true
    };
    */
  } catch (error) {
    console.error('Erreur lors de la récupération de la vidéo:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Erreur lors de la récupération de la vidéo',
        details: error.message
      })
    };
  }
}; 