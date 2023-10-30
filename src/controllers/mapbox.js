const AWS = require('@aws-sdk/client-s3');
const { mapbox } = require('../api/index.js');
const sharp = require('sharp');

const uploadMB = async (req, res) => {
    const { token, user, tileName, tileSourceName, group} = req.body
    const { buffer } = req.file

    try {
        //----> Resgatar credenciais AWS S3 via Mapbox Tileset API
        const s3UploadDetails = await mapbox(`https://api.mapbox.com/uploads/v1/${user}/credentials?access_token=${token}`)
        console.log('Get Credentials Mapbox')
        const { accessKeyId, bucket, key, secretAccessKey, sessionToken } = s3UploadDetails
        if (accessKeyId && secretAccessKey && sessionToken) {
            console.log('Success Get Credentials')
            //----> Ativar cliente via AWS SDKs
            const client = new AWS.S3Client({ 
                credentials: {
                    accessKeyId,
                    secretAccessKey, 
                    sessionToken
                },
                region: 'us-east-1'
            })
            //----> Carregar imagem no Bucket S3 via AWS SDK
            await client.send(
                new AWS.PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, verifyTileset:  `${user}.${group}_${tileSourceName}`})
            ).then( async () => {
                console.log('Success Put Object AWS')
                // ----> Carregar imagem via Mapbox Tileset API
                var uploadTileset = await mapbox({
                    method: 'post',
                    headers: {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache',
                    },
                    url: `https://api.mapbox.com/uploads/v1/${user}?access_token=${token}`,
                    data: {
                        url: `http://${bucket}.s3.amazonaws.com/${key}`,
                        name: tileName,
                        tileset: `${user}.${group}_${tileSourceName}`,
                    },
                })

                if (uploadTileset.Error) {
                    console.log('Fail Upload Object Mapbox')
                    return res.status(402).json(
                        { mensage: `Mapbox ${uploadTileset.Error ? uploadTileset.Error : 'Mapbox Request failed with status code 422'}` }
                    )
                } else {
                    return res.status(200).json(verifyTileset)
                }
            }).catch((error) => {
                console.log('Fail Put Object AWS', error);
                return res.status(402).json(
                    { mensage: `AWS ${error}` }
                )
            })
        } else {
            console.log('Fail Get Credentials Mapbox', error);
            res.json(
                { mensage: `Mapbox Error: ${s3UploadDetails.Error}` }
            )
        }
    } catch (error) {
        console.log(error.message)
    }
}

const lastUploads = async (req, res) => {
    const { user, token } = req.query
    let uploadList = await mapbox(`https://api.mapbox.com/uploads/v1/${user}?reverse=true&limit=100&access_token=${token}`)

    if (uploadList.Error) {
        return res.status(402).json({message: uploadList.Error})
    } else {
        await uploadList.sort((a, b) => new Date(b.created) - new Date(a.created))
        return res.status(200).json(uploadList)
    }
}

const deletItemOfLastUploads = async (req, res) => {
    const { user, item, token } = req.query
    const removeItem = await mapbox({
        method: 'delete',
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
        },
        url: `https://api.mapbox.com/uploads/v1/${user}/${item}?access_token=${token}`
    })

    if (removeItem.Error) {
        return res.status(402).json({message: removeItem.Error})
    } else {
        return res.status(200).json(removeItem)
    }
}

const listTilesetsSources = async (req, res) => {
    const {token, user, group, tlsSourceName} = req.query
    const stringReq = `${user}.${group}_${tlsSourceName}`

    try {
        const list = await mapbox(`https://api.mapbox.com/tilesets/v1/guidora?access_token=${token}`)
        console.log(list);
        if (list.Error) {
            return res.status(402).json({message: `Mapbox Token error: ${list.Error}`})
        } else {
            const response = list?.filter((item) => {
                return stringReq === item.id
            })
            return res.status(200).json(response)
        }
    } catch (error) {
        console.log(error.message)
    }
}

const previewTif = async (req,res) => {
    const { buffer } = req.file
    console.log(req.file)
    const maxPixels = 4500

    try {
        sharp(buffer, { limitInputPixels: false })
        .resize({ width: maxPixels, height: maxPixels, fit: 'inside' }) // Resize to fit within the limit
        .toFormat('png')
        .toBuffer()
        .then((pngBuffer) => {
            // Convert the PNG buffer to Base64
            const base64PNG = pngBuffer.toString('base64')

            return res.status(200).json(`data:image/png;base64,${base64PNG}`)
        })
        .catch((err) => {
            console.error('Error:', err)
            return res.status(402).json({message: `${err}`})
        })
    } catch (error) {
        return res.status(402).json({message: `Não foi possível carregar o preview da imagem.`})
    }
}

module.exports = {
    uploadMB,
    lastUploads,
    deletItemOfLastUploads,
    listTilesetsSources,
    previewTif
}