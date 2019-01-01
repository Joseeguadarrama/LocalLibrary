var Genre = require('../models/genre'); //may not need this
var Book = require('../models/book');
var async = require('async');

const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

// Display list of all Genre.
exports.genre_list = function(req, res, next) {

    Genre.find()
        .sort([['name', 'ascending']])
        .exec(function (err, list_genres){
            if (err) { return next(err); }
            //Successful, so render
            res.render('genre_list', {title: "Genre List", genre_list: list_genres});
        });

};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
    
    async.parallel({
        genre: function(callback) {
            Genre.findById(req.params.id)
                .exec(callback);
        },

        genre_books: function(callback) {
            Book.find({'genre': req.params.id})
                .exec(callback);
        },

    }, function(err, results) {
        if (err) { return next(err); }
        if (results.genre == null){ // No results.
            var error = new Error('Genre not found');
            error.status = 404;
            return next(error);
        }
        // Successful, so render
        res.render('genre_detail', { title: 'Genre Detail', genre: results.genre, genre_books: results.genre_books });
    });

};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form', {title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
   
    // Validate that the name field is not empty.
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),
    
    // Sanitize (trim and escape) the name field.
    sanitizeBody('name').trim().escape(),
  
    // Process request after validation and sanitization.
    (req, res, next) => {
  
      // Extract the validation errors from a request.
      const errors = validationResult(req);
  
      // Create a genre object with escaped and trimmed data.
      var genre = new Genre(
        { name: req.body.name }
      );
  
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
        return;
      }
      else {
        // Data from form is valid.
        // Check if Genre with same name already exists.
        Genre.findOne({ 'name': req.body.name })
          .exec( function(err, found_genre) {
             if (err) { return next(err); }
  
             if (found_genre) {
               // Genre exists, redirect to its detail page.
               res.redirect(found_genre.url);
             }
             else {
  
               genre.save(function (err) {
                 if (err) { return next(err); }
                 // Genre saved. Redirect to genre detail page.
                 res.redirect(genre.url);
               });
  
             }
  
           });
      }
    }
  ];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res, next) {
    
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function (callback) {
            Book.find({'genre': req.params.id}).exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        if (results.genre == null) { // No results found.
            res.redirect('/catalog/genres');
        }
        // Successful, so render
        res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books } );
    });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res) {
    
    async.parallel({
        genre: function (callback) {
            Genre.findById(req.params.id).exec(callback);
        },
        genre_books: function (callback) {
            Book.find({'genre': req.params.id}).exec(callback);
        },
    }, function (err, results) {
        if (err) { return next(err); }
        // Success
        if(results.genre_books.length > 0){
           //Genre has books. Render in same way as for GET route.
           res.render('genre_delete', { title: 'Delete Genre', genre: results.genre, genre_books: results.genre_books } );
           return;
        }
        else {
             // Genre has no books. Delete object and redirect tot eh list of genres.
             Genre.findByIdAndRemove(req.body.genreid, function deleteGenre(err){
                 if(err){ return next(err); }
                 //Success - go to genre list
                 res.redirect('/catalog/genres');
             });
        }
    });
};

// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    
    Genre.findById(req.params.id)
        .exec(function (err, results) {
            if (err) { return next(err); }
            if (results == null) { 
                // No results.
                var error = new Error('Genre not found');
                error.status = 404;
                return next(error);
            }
            res.render('genre_form', { title: 'Update Genre', genre: results });
        });
};

// Handle Genre update on POST.
exports.genre_update_post = [

    // Validate and Sanitize name field.
    body('name', 'Genre name required').isLength({ min: 1 }).trim(),
    sanitizeBody('name').trim().escape(),

    // Process request after validation and sanitization.
    (req, res, next) => {

        // Extract the validation and sanitization.
        const errors = validationResult(req);

        // Create a genre object with escaped and trimmed data.
        var genre = new Genre({
            name: req.body.name,
            _id: req.body.id
        });

        if (!errors.isEmpty()) {
            // There are errors. Render the form again with sanitized values/error messages.
            res.render('genre_form', {
                title: 'Create Genre',
                genre: genre,
                errors: errors.array()
            });
            return;
        } 
        else {
            // Data from form is valid. Update the record.
            Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err,thegenre) {
                if (err) { return next(err); }
                   // Successful - redirect to genre detail page.
                   res.redirect(thegenre.url);
                });
        }
        // else {
        //     //Data from form is valid.
        //     //Check if Genre with name already exists.
        //     Genre.findOne({
        //             'name': req.body.name
        //         })
        //         .exec(function (err, found_genre) {
        //             if (err) { return next(err); }
        //             if (found_genre) {
        //                 // Genre exists, return an alert and reRender.
        //                 res.render('genre_form', {
        //                     title: 'Create Genre',
        //                     genre: genre,
        //                     errors: errors.array()
        //                 });
        //                 return;
        //             } else {
        //                 Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err, thegenre) {
        //                     if (err) { return next(err); }
        //                     //Genre updated. Redirect to genre detail page.
        //                     res.redirect(thegenre.url);
        //                 });
        //             }
        //         });
        // }
    }

]