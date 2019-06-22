const cron = require("node-cron");
const express = require("express");
const fs = require("fs");
const axios = require('axios');
const mysql = require('mysql')
const nodemailer = require("nodemailer");
const ejs = require('ejs');
const template = './template.ejs'
var smtpTransport = require('nodemailer-smtp-transport');

app = express();

 // create mail transporter
 let transporter = nodemailer.createTransport(smtpTransport({
    service: "gmail",
    host: 'smtp.gmail.com',
    auth: {
      user: "quangtuanhv@gmail.com",
      pass: "quangtuanvo"
    }
  }));

var connection = mysql.createConnection({
    host: "localhost",
    user: "olga",
    port: 3306,
    password: "olga@xxx",
    database: "new_fashion"
});
const listApi = [
    'https://gateway.chotot.com/v1/public/ad-listing?region_v2=3017&cg=2010&w=1&limit=2&st=s,k',
    'https://gateway.chotot.com/v1/public/ad-listing?region_v2=3016&cg=2010&w=1&limit=2&st=s,k',
    'https://gateway.chotot.com/v1/public/ad-listing?region_v2=3016&cg=2020&w=1&limit=2&st=s,k',
    'https://gateway.chotot.com/v1/public/ad-listing?region_v2=3017&cg=2020&w=1&limit=2&st=s,k'
];
for (let index = 0; index < listApi.length; index++) {
  const url = listApi[index];

  cron.schedule("*/5 * * * *", function(){
    axios.get(url)
    .then(function (response) {
        let dataResponse = response.data.ads

        dataResponse.forEach(element => {

            var sql = "INSERT INTO new (list_id, subject, price_string, area_name, noty, slug) VALUES (?);";
            var values = [element.list_id, element.subject, element.price_string, element.area_name, 0, `https://xe.chotot.com/${element.list_id}.htm`];
            



            connection.beginTransaction(function(err) {
                


                connection.query(sql, [values], function (err, result) {
                  if (err) {
                    console.log("Email don't sent!");

                    return connection.rollback();
                  }
                  var log = 'Post ' + result.insertId + ' added';

      
                        ejs.renderFile(template, {element}, (err, html) => {
                          
                          if (err) console.log(err);
                          
                        let mailOptions = {
                            from: "quangtuanhv@gmail.com",
                            to: "minhtoanhhhhh@gmail.com",
                            subject: `Thông báo từ chợ tốt !`,
                            html: html
                        };
                        transporter.sendMail(mailOptions, function(error, info) {
                          
                            if (error) {
                            throw error;
                            } else {
                              connection.query('UPDATE new set noty = true where id = ?', element.list_id, (err, rows) => {
                                if (err) {
                                    return connection.rollback();
                                  }
                                  connection.commit(function(err) {
                                    if (err) {
                                      return connection.rollback();
                                    }
      
                                    console.log("Email successfully sent!");
                              });
                              console.log(element);
                            });
      
                            }
                        });
                      });
                    
      
                });



          });

        });
    })
  });

}
app.listen("3128");