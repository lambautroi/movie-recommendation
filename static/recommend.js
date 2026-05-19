$(function() {
  // Button will be disabled until we type anything inside the input field
  const source = document.getElementById('autoComplete');
  const inputHandler = function(e) {
    if(e.target.value==""){
      $('.movie-button').attr('disabled', true);
    }
    else{
      $('.movie-button').attr('disabled', false);
    }
  }
  source.addEventListener('input', inputHandler);

  $('.movie-button').on('click',function(){
    var my_api_key = '5ce2ef2d7c461dea5b4e04900d1c561e';
    var title = $('.movie').val();
    if (title=="") {
      $('.results').css('display','none');
      $('.fail').css('display','block');
    }
    else{
      load_details(my_api_key,title);
    }
  });
});

// will be invoked when clicking on the recommended movies
function recommendcard(e){
  var my_api_key = '5ce2ef2d7c461dea5b4e04900d1c561e';
  var title = e.getAttribute('title'); 
  load_details(my_api_key,title);
}

// get the basic details of the movie from the API (based on the name of the movie)
function load_details(my_api_key,title){
  $.ajax({
    type: 'GET',
    url:'https://api.themoviedb.org/3/search/movie?api_key='+my_api_key+'&query='+title,

    success: function(movie){
      if(movie.results.length<1){
        $('.fail').css('display','block');
        $('.results').css('display','none');
        $("#loader").delay(500).fadeOut();
      }
      else{
        $("#loader").fadeIn();
        $('.fail').css('display','none');
        $('.results').delay(1000).css('display','block');
        var movie_id = movie.results[0].id;
        var movie_title = movie.results[0].original_title;
        movie_recs(movie_title,movie_id,my_api_key);
      }
    },
    error: function(){
      alert('Invalid Request');
      $("#loader").delay(500).fadeOut();
    },
  });
}

// passing the movie name to get the similar movies from python's flask
function movie_recs(movie_title,movie_id,my_api_key){
  $.ajax({
    type:'POST',
    url:'/similarity',
    data:{'name':movie_title},
    success: function(recs){
      if(recs=="Xin lỗi! Bộ phim bạn yêu cầu không có trong cơ sở dữ liệu. Vui lòng kiểm tra lại chính tả hoặc thử với phim khác."){
        $.ajax({
          type: 'GET',
          url: "https://api.themoviedb.org/3/movie/" + movie_id + "/similar?api_key=" + my_api_key,
          success: function(similar_data) {
             if(similar_data.results && similar_data.results.length > 0) {
                var arr = [];
                var count = Math.min(10, similar_data.results.length);
                for(var i=0; i<count; i++){
                  arr.push(similar_data.results[i].title);
                }
                $('.fail').css('display','none');
                $('.results').css('display','block');
                get_movie_details(movie_id,my_api_key,arr,movie_title);
             } else {
                $('.fail').css('display','block');
                $('.results').css('display','none');
                $("#loader").delay(500).fadeOut();
             }
          },
          error: function() {
            $('.fail').css('display','block');
            $('.results').css('display','none');
            $("#loader").delay(500).fadeOut();
          }
        });
      }
      else {
        $('.fail').css('display','none');
        $('.results').css('display','block');
        var movie_arr = recs.split('---');
        var arr = [];
        for(const movie in movie_arr){
          arr.push(movie_arr[movie]);
        }
        get_movie_details(movie_id,my_api_key,arr,movie_title);
      }
    },
    error: function(){
      alert("error recs");
      $("#loader").delay(500).fadeOut();
    },
  }); 
}

// get all the details of the movie using the movie id.
function get_movie_details(movie_id,my_api_key,arr,movie_title) {
  $.ajax({
    type:'GET',
    url:'https://api.themoviedb.org/3/movie/'+movie_id+'?api_key='+my_api_key,
    success: function(movie_details){
      show_details(movie_details,arr,movie_title,my_api_key,movie_id);
    },
    error: function(){
      alert("API Error!");
      $("#loader").delay(500).fadeOut();
    },
  });
}

// passing all the details to python's flask for displaying and scraping the movie reviews using imdb id
async function show_details(movie_details,arr,movie_title,my_api_key,movie_id){
  var imdb_id = movie_details.imdb_id;
  var poster = 'https://image.tmdb.org/t/p/original'+movie_details.poster_path;
  var overview = movie_details.overview;
  var genres = movie_details.genres;
  var rating = movie_details.vote_average;
  var vote_count = movie_details.vote_count;
  var release_date = new Date(movie_details.release_date);
  var runtime = parseInt(movie_details.runtime);
  var status = movie_details.status;
  var genre_list = []
  for (var genre in genres){
    genre_list.push(genres[genre].name);
  }
  var my_genre = genre_list.join(", ");
  if(runtime%60==0){
    runtime = Math.floor(runtime/60)+" hour(s)"
  }
  else {
    runtime = Math.floor(runtime/60)+" hour(s) "+(runtime%60)+" min(s)"
  }
  var movie_cast = await get_movie_cast(movie_id, my_api_key);
  
  var [arr_poster, ind_cast] = await Promise.all([
    get_movie_posters(arr, my_api_key),
    get_individual_cast(movie_cast, my_api_key)
  ]);
  
  var trailer_key = "";
  try {
    var video_data = await $.ajax({
      type: 'GET',
      url: "https://api.themoviedb.org/3/movie/" + movie_id + "/videos?api_key=" + my_api_key
    });
    for(var i=0; i<video_data.results.length; i++){
      if(video_data.results[i].type == "Trailer" && video_data.results[i].site == "YouTube"){
        trailer_key = video_data.results[i].key;
        break;
      }
    }
  } catch(e) {}

  details = {
    'title':movie_title,
    'trailer_key': trailer_key,
    'cast_ids':JSON.stringify(movie_cast.cast_ids),
      'cast_names':JSON.stringify(movie_cast.cast_names),
      'cast_chars':JSON.stringify(movie_cast.cast_chars),
      'cast_profiles':JSON.stringify(movie_cast.cast_profiles),
      'cast_bdays':JSON.stringify(ind_cast.cast_bdays),
      'cast_bios':JSON.stringify(ind_cast.cast_bios),
      'cast_places':JSON.stringify(ind_cast.cast_places),
      'imdb_id':imdb_id,
      'poster':poster,
      'genres':my_genre,
      'overview':overview,
      'rating':rating,
      'vote_count':vote_count.toLocaleString(),
      'release_date':release_date.toDateString().split(' ').slice(1).join(' '),
      'runtime':runtime,
      'status':status,
      'rec_movies':JSON.stringify(arr),
      'rec_posters':JSON.stringify(arr_poster),
  }

  var form = $('<form action="/recommend" method="POST"></form>');
  for (var key in details) {
    if (details.hasOwnProperty(key)) {
      var input = $('<input type="hidden" name="' + key + '">');
      input.val(details[key]);
      form.append(input);
    }
  }
  $('body').append(form);
  form.submit();
}

// get the details of individual cast
async function get_individual_cast(movie_cast, my_api_key) {
  var promises = movie_cast.cast_ids.map(cast_id => {
    return $.ajax({
      type: 'GET',
      url: 'https://api.themoviedb.org/3/person/' + cast_id + '?api_key=' + my_api_key
    }).then(cast_details => {
      var bday = cast_details.birthday ? new Date(cast_details.birthday).toDateString().split(' ').slice(1).join(' ') : "N/A";
      return {
        bday: bday,
        bio: cast_details.biography || "N/A",
        place: cast_details.place_of_birth || "N/A"
      };
    }).catch(() => ({ bday: "N/A", bio: "N/A", place: "N/A" }));
  });
  
  var results = await Promise.all(promises);
  return {
    cast_bdays: results.map(r => r.bday),
    cast_bios: results.map(r => r.bio),
    cast_places: results.map(r => r.place)
  };
}

// getting the details of the cast for the requested movie
async function get_movie_cast(movie_id, my_api_key) {
  var cast_ids = [], cast_names = [], cast_chars = [], cast_profiles = [];
  try {
    var my_movie = await $.ajax({
      type: 'GET',
      url: "https://api.themoviedb.org/3/movie/" + movie_id + "/credits?api_key=" + my_api_key
    });
    var top_cast = my_movie.cast.length >= 10 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] : Array.from({length: my_movie.cast.length}, (_, i) => i);
    for (var my_cast of top_cast) {
      cast_ids.push(my_movie.cast[my_cast].id);
      cast_names.push(my_movie.cast[my_cast].name);
      cast_chars.push(my_movie.cast[my_cast].character);
      var profile = my_movie.cast[my_cast].profile_path ? 
          "https://image.tmdb.org/t/p/original" + my_movie.cast[my_cast].profile_path : 
          "https://via.placeholder.com/240x360?text=Khong+Co+Anh";
      cast_profiles.push(profile);
    }
  } catch (err) {}
  return { cast_ids: cast_ids, cast_names: cast_names, cast_chars: cast_chars, cast_profiles: cast_profiles };
}

// getting posters for all the recommended movies
async function get_movie_posters(arr, my_api_key) {
  var promises = arr.map(m => {
    return $.ajax({
      type: 'GET',
      url: 'https://api.themoviedb.org/3/search/movie?api_key=' + my_api_key + '&query=' + encodeURIComponent(m)
    }).then(m_data => {
      if (m_data.results && m_data.results.length > 0 && m_data.results[0].poster_path) {
        return 'https://image.tmdb.org/t/p/original' + m_data.results[0].poster_path;
      } else {
        return 'https://via.placeholder.com/360x240?text=Khong+Co+Anh';
      }
    }).catch(() => 'https://via.placeholder.com/360x240?text=Khong+Co+Anh');
  });
  return Promise.all(promises);
}

// ================= WATCHLIST LOGIC =================
$(document).ready(function() {
  function updateWatchlistButtons() {
    var watchlist = JSON.parse(localStorage.getItem('movieWatchlist')) || [];
    $('.btn-watchlist').each(function() {
      var title = $(this).data('title');
      var isSaved = watchlist.find(m => m.title === title);
      if (isSaved) {
        $(this).removeClass('btn-outline-light').addClass('btn-danger');
        $(this).find('.icon').text('💔');
        $(this).find('.text').text('Xóa khỏi Yêu thích');
      } else {
        $(this).removeClass('btn-danger').addClass('btn-outline-light');
        $(this).find('.icon').text('❤️');
        $(this).find('.text').text('Thêm vào Yêu thích');
      }
    });
  }

  updateWatchlistButtons();

  $('.btn-watchlist').click(function() {
    var title = $(this).data('title');
    var poster = $(this).data('poster');
    var watchlist = JSON.parse(localStorage.getItem('movieWatchlist')) || [];
    
    var existingIndex = watchlist.findIndex(m => m.title === title);
    if (existingIndex > -1) {
      watchlist.splice(existingIndex, 1);
    } else {
      watchlist.push({title: title, poster: poster});
    }
    
    localStorage.setItem('movieWatchlist', JSON.stringify(watchlist));
    updateWatchlistButtons();
  });
});

// ================= RATING LOGIC =================
$(document).ready(function() {
  function updateStars(container, rating) {
    container.find('.star').each(function() {
      var starValue = $(this).data('value');
      if (starValue <= rating) {
        $(this).removeClass('fa-star-o').addClass('fa-star');
      } else {
        $(this).removeClass('fa-star').addClass('fa-star-o');
      }
    });
  }

  $('.star-rating').each(function() {
    var title = $(this).data('title');
    var ratings = JSON.parse(localStorage.getItem('movieRatings')) || {};
    var currentRating = ratings[title] || 0;
    updateStars($(this), currentRating);
  });

  $('.star-rating .star').hover(
    function() {
      var hoverValue = $(this).data('value');
      var container = $(this).parent();
      updateStars(container, hoverValue);
    },
    function() {
      var container = $(this).parent();
      var title = container.data('title');
      var ratings = JSON.parse(localStorage.getItem('movieRatings')) || {};
      var currentRating = ratings[title] || 0;
      updateStars(container, currentRating);
    }
  );

  $('.star-rating .star').click(function() {
    var value = $(this).data('value');
    var container = $(this).parent();
    var title = container.data('title');
    
    var ratings = JSON.parse(localStorage.getItem('movieRatings')) || {};
    ratings[title] = value;
    localStorage.setItem('movieRatings', JSON.stringify(ratings));
    
    updateStars(container, value);
  });
});

