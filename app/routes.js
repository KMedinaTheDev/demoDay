module.exports = function(app, passport, db, multer, ObjectId) {

// normal routes ===============================================================


    // show the home page (will also have our login links)
    app.get('/', function(req, res) {
    db.collection('users').find().toArray((err, result) =>{
      if (err) return console.log(err)
      console.log(req)
        res.render('index.ejs', {
          users: res,
          profiles: res
          })
        });
    });

    //DASHBOARD ====================
    app.get('/dashboard', isLoggedIn, function(req, res) {
      res.render('dashboard.ejs', {
        user : req.user,
        profiles: res,
        messages: res
      })

    });



    // PROFILE SECTION =========================
    app.get('/profile/:id', function(req, res) {
      uId = ObjectId(req.params.id)
        db.collection('users').findOne({"_id": uId},(err, result) => {
          if (err) return console.log(err)
          res.render('profile.ejs', {
            user : req.user,
            profiles: result,
            messages: result
          })
        })
    });

    // LOGOUT ==============================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// Post and render profile w/ info.==========
app.post('/profiles', (req,res) => {
  var uId = ObjectId(req.session.passport.user)
  console.log(req);
  db.collection('users').findOneAndUpdate({"_id": uId}, {
    $set: {
      email:req.body.email,
      name: req.body.name,
      location: req.body.location,
      shelters: req.body.shelters,
      story: req.body.story,
      gameplan: req.body.gameplan,
      needs: req.body.asks,
      size: req.body.size,
      updates: req.body.updates,
      memoir: req.body.memoir
    }
  }, {
    sort: {_id: -1},
    upsert: false
  }, (err, result) => {
    if (err) return res.send(err)
      res.redirect('/dashboard')
})
});
// ============================================



// message board routes ===============================================================

    // app.post('/messages', (req, res) => {
    //   db.collection('messages').save({name: req.body.name, msg: req.body.msg, thumbUp: 0, thumbDown:0}, (err, result) => {
    //     if (err) return console.log(err)
    //     console.log('saved to database')
    //     res.redirect('/profile')
    //   })
    // })
    //
    // app.put('/messages', (req, res) => {
    //   db.collection('messages')
    //   .findOneAndUpdate({name: req.body.name, msg: req.body.msg}, {
    //     $set: {
    //       thumbUp:req.body.thumbUp + 1
    //     }
    //   }, {
    //     sort: {_id: -1},
    //     upsert: true
    //   }, (err, result) => {
    //     if (err) return res.send(err)
    //     res.send(result)
    //   })
    // })
    //
    // app.delete('/messages', (req, res) => {
    //   db.collection('messages').findOneAndDelete({name: req.body.name, msg: req.body.msg}, (err, result) => {
    //     if (err) return res.send(500, err)
    //     res.send('Message deleted!')
    //   })
    // })
//---------------------------------------
// IMAGE CODE
//---------------------------------------
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/images/uploads')
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname + '-' + Date.now() + ".png")
    }
});
var upload = multer({storage: storage});

app.post('/up', upload.single('file-to-upload'), (req, res, next) => {

    insertDocuments(db, req, 'images/uploads/' + req.file.filename, () => {
        //db.close();
        //res.json({'message': 'File uploaded successfully'});
        res.redirect('/dashboard')
    });
});

var insertDocuments = function(db, req, filePath, callback) {
    var collection = db.collection('users');
    var uId = ObjectId(req.session.passport.user)
    collection.findOneAndUpdate({"_id": uId}, {
      $set: {
        profileImg: filePath
      }
    }, {
      sort: {_id: -1},
      upsert: false
    }, (err, result) => {
      if (err) return res.send(err)
      callback(result)
    })
    // collection.findOne({"_id": uId}, (err, result) => {
    //     //{'imagePath' : filePath }
    //     //assert.equal(err, null);
    //     callback(result);
    // });
}
//---------------------------------------
// IMAGE CODE END
//---------------------------------------

// =============================================================================
// AUTHENTICATE (FIRST LOGIN) ==================================================
// =============================================================================

    // locally --------------------------------
        // LOGIN ===============================
        // show the login form
        app.get('/login', function(req, res) {
            res.render('login.ejs', { message: req.flash('loginMessage') });
        });

        // process the login form
        app.post('/login', passport.authenticate('local-login', {
            successRedirect : '/dashboard', // redirect to the secure profile section
            failureRedirect : '/login', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

        // SIGNUP =================================
        // show the signup form
        app.get('/signup', function(req, res) {
            res.render('signup.ejs', { message: req.flash('signupMessage') });
        });

        // process the signup form
        app.post('/signup', passport.authenticate('local-signup', {
            successRedirect : '/dashboard', // redirect to the secure profile section
            failureRedirect : '/signup', // redirect back to the signup page if there is an error
            failureFlash : true // allow flash messages
        }));

// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------
    app.get('/unlink/local', isLoggedIn, function(req, res) {
        var user            = req.user;
        user.local.email    = undefined;
        user.local.password = undefined;
        user.save(function(err) {
            res.redirect('/profile');
        });
    });

};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated())
        return next();

    res.redirect('/');
}
