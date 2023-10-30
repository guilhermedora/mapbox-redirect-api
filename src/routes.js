const express = require('express');
const multer = require('./config/multer-config.js');

const {
    uploadMB,
    lastUploads,
    deletItemOfLastUploads,
    listTilesetsSources,
    previewTif
} = require('./controllers/mapbox');

const rotas = express()

rotas.post('/mapbox-create-preview', multer.single("file"), previewTif)
rotas.post('/mapbox-upload-tile', multer.single("file"), uploadMB)
rotas.get('/mapbox-source-list', listTilesetsSources)
rotas.get('/mapbox-upload-list', lastUploads)
rotas.delete('/mapbox-upload-delete', deletItemOfLastUploads)

module.exports = rotas