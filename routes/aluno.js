var express = require('express');
var router = express.Router();
var mysql = require('mysql2');
var secp256k1 = require('secp256k1');
var cryptoJS = require("crypto-js");
var sha256 = require("crypto-js/sha256");
var { randomBytes } = require('crypto');
var { hexStringToUint8Array } = require('../utils/utils');
var config = require('../config.json');


const dbconn = mysql.createConnection({
    host: config.mysqlhost,
    port: config.mysqlport,
    user: config.mysqluser,
    password: config.mysqlpassword,
    database: config.mysqldatabase,
  });


router.post('/newkey', function(req, res, next) {
    var idAluno = req.body.idAluno;

    if ( idAluno ){
        dbconn.query("SELECT COUNT(idAluno) AS alunoCounter, idAluno, SHA2(CONCAT(nome, cpf, canac), '256') AS hashSHA256 FROM t_Aluno WHERE t_Aluno.idAluno = ?", [parseInt(idAluno)], function(error, results, fields) {
            
            if (results[0].alunoCounter == 1) {
                    var hashSHA256 = results[0].hashSHA256;
                    dbconn.query('SELECT COUNT(idAlunoCertificado) AS alunoCertificadoCounter FROM t_AlunoCertificado WHERE t_AlunoCertificado.idAluno = ?', [parseInt(idAluno)], function(error, results, fields){
                        if ( results[0].alunoCertificadoCounter == 0 ) {

                            var privateKey;
                            do {
                                privateKey = randomBytes(32);
                            } while (!secp256k1.privateKeyVerify(privateKey));
                            var publicKey = secp256k1.publicKeyCreate(privateKey);

                            dbconn.query('INSERT INTO t_AlunoCertificado (idAluno, secp256k1privateKey, secp256k1publicKey, hashSHA256) VALUES ( ?, ?, ?, ? )', [ idAluno, privateKey.toString('hex'), Buffer.from(publicKey).toString('hex'), hashSHA256 ], function(error, results, fields){
                                if (!error) {
                                    res.status(200).json({ message: { privateKey: privateKey.toString('hex'), publicKey: Buffer.from(publicKey).toString('hex'), hashSHA256: hashSHA256 } });
                                } else {
                                    res.status(500).json({ error: '500 - ' + error });
                                }
                            });
                            
                        } else {
                            res.status(401).json({ error: '401 - Certificate already exists.' });
                        }
                    });
            }
            else {
                res.status(404).json({ error: '404 - idAluno not found' });
            }
        });
    }
    else {
      res.status(400).json({ error: '400 - Invalid idAluno' });
    }
  
  });
  
  
  
  router.post('/sign', function(req, res, next) {
    var privateKey = req.body.privateKey;
    var uuidVoo = req.body.uuidVoo;
    var uuidAluno = req.body.uuidAluno;
  
    if ( privateKey && uuidVoo && uuidAluno ) {
      try {
        var message = sha256(JSON.stringify({ uuidVoo: uuidVoo, uuidAluno: uuidAluno }));
        var messageBuffer = Buffer.from(message.toString(cryptoJS.enc.Hex), "hex");
        var privateKeyBuffer = Buffer.from(privateKey, "hex");
        var signObj = secp256k1.ecdsaSign(messageBuffer, privateKeyBuffer);
        var signature = Buffer.from(signObj.signature).toString('hex');
  
        res.status(200).json({ message: { signature: signature }});
      } catch (err) {
        res.status(400).json({ message: "Failed to Sign" });
      }
    } else {
      res.status(404).json({ message: "404 - Bad request" });
    }
  });
  
  
  router.post('/verify', function(req, res, next) {
    var publicKey = req.body.publicKey;
    var uuidVoo = req.body.uuidVoo;
    var uuidAluno = req.body.uuidAluno;
    var signature = req.body.signature;
  
    if ( publicKey && uuidVoo && uuidAluno && signature ) {
      try {
        var publicKeyBuffer = Buffer.from(publicKey, "hex");
        var message = sha256(JSON.stringify({ uuidVoo: uuidVoo, uuidAluno: uuidAluno }));
        var messageBuffer = Buffer.from(message.toString(cryptoJS.enc.Hex), "hex");
        var signatureBuffer = Buffer.from(signature, "hex");
  
        var ecdsaVerify = secp256k1.ecdsaVerify(signatureBuffer, messageBuffer, publicKeyBuffer);
  
        res.status(200).json({ message: { signature: ecdsaVerify }});
      } catch (err) {
        res.status(400).json({ message: "Failed to Verify" });
      }
    } else {
      res.status(404).json({ message: "404 - Bad request" });
    }

  });


  module.exports = router;