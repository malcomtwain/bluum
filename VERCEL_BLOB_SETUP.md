# Configuration Vercel Blob pour Bluum

## 🎯 Avantages de Vercel Blob

- **100 Go de stockage gratuit** (vs 10 Go pour Cloudflare R2)
- **Pas de frais de trafic sortant** (vs $0.01/GB pour Cloudflare)
- **Intégration native** avec l'écosystème Vercel
- **Performance globale** avec CDN intégré

## 🚀 Installation

1. **Installer le package** (déjà fait) :
   ```bash
   npm install @vercel/blob
   ```

2. **Créer un compte Vercel** :
   - Va sur [vercel.com](https://vercel.com)
   - Crée un compte gratuit

3. **Créer un projet Vercel** :
   - Clique sur "New Project"
   - Importe ton projet GitHub (Bluum_1.4)
   - Déploie le projet

4. **Configurer Vercel Blob** :
   - Dans ton dashboard Vercel, va dans **Storage**
   - Clique sur **Create Database**
   - Sélectionne **Blob**
   - Note le **BLOB_READ_WRITE_TOKEN**

## 🔑 Configuration des variables d'environnement

Crée un fichier `.env.local` à la racine de ton projet :

```bash
# Vercel Blob Configuration
BLOB_READ_WRITE_TOKEN=vercel_blob_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Supabase Configuration (garder si tu veux)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📁 Structure de stockage

Vercel Blob organise automatiquement les fichiers par utilisateur :

```
invitation_BLUUM-2c60-c466-ccfe-5118/
├── video_123.mp4
├── template_456.png
└── music_789.mp3

invitation_BLUUM-3d70-d577-ddff-6229/
├── clip_001.mp4
└── song_002.mp3
```

## 🔄 Ordre de priorité des stockages

1. **Vercel Blob** (100 GB gratuit) - Priorité 1
2. **Supabase Storage** (10 GB gratuit) - Priorité 2  
3. **LocalStorage** (illimité mais temporaire) - Fallback

## 🧪 Test de la configuration

1. **Redémarre ton app** après avoir ajouté la variable d'environnement
2. **Upload un fichier** - tu devrais voir dans la console :
   ```
   Attempting to upload to Vercel Blob...
   Successfully uploaded to Vercel Blob
   ```
3. **Vérifie dans ton dashboard Vercel** que le fichier apparaît

## 🚨 Résolution des problèmes

### Erreur "BLOB_READ_WRITE_TOKEN not configured"
- Vérifie que le fichier `.env.local` existe
- Vérifie que la variable est correctement nommée
- Redémarre ton app

### Erreur "Vercel Blob upload failed"
- Vérifie que ton token est valide
- Vérifie que tu as bien créé un projet Vercel
- Vérifie que Vercel Blob est activé dans ton projet

### Fallback automatique
Si Vercel Blob échoue, l'app bascule automatiquement vers :
1. Supabase Storage
2. LocalStorage

## 💰 Coûts après la limite gratuite

- **100 GB inclus gratuitement**
- **Au-delà** : $0.0004/GB/mois (très bon marché !)
- **Trafic sortant** : Gratuit (vs $0.01/GB chez Cloudflare)

## 🔧 Fonctions disponibles

- `uploadToVercelBlob()` - Upload de fichiers
- `deleteFromVercelBlob()` - Suppression de fichiers  
- `listVercelBlobFiles()` - Liste des fichiers
- `getVercelBlobFileInfo()` - Informations sur un fichier

## 📊 Monitoring

Dans ton dashboard Vercel, tu peux voir :
- **Espace utilisé** / 100 GB
- **Fichiers stockés**
- **Trafic sortant** (gratuit)
- **Performance** et **latence**

---

**🎉 Félicitations !** Tu as maintenant 100 GB de stockage gratuit avec Vercel Blob !
