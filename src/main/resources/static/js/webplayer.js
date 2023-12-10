let left_scroll = document.getElementById("left_scroll");
let right_scroll = document.getElementById("right_scroll");

let pop_song = document.getElementsByClassName("pop_song")[0];
if (left_scroll) {
  left_scroll.addEventListener("click", () => {
    console.log("hey");
    pop_song.scrollLeft -= 416;
  });
}
if (right_scroll) {
  right_scroll.addEventListener("click", () => {
    pop_song.scrollLeft += 416;
  });
}

let host = "http://localhost:8080/rest";
var app = angular
  .module("webplayerApp", [])
  .controller("webplayerCtrl", function ($scope, $http, $interval, $location) {
    //tat ca album trong database
    $scope.fullalbum;
    $scope.song_play;
    //tat ca bai hat trong database
    $scope.fullsongs;
    $scope.currentSongIndex = 0; // Index của bài hát hiện tại trong danh sách songs
    $scope.playlistData;
    $scope.playlistData2;
    $scope.account;
    $scope.find_songinfo = function () {
      var url = `${host}/songsinfo/`;
      $http
        .get(url)
        .then((resp) => {
          $scope.fullsongs = resp.data;
          // Duyệt qua mỗi bài hát và xác định thời lượng
          $scope.fullsongs.forEach(function (song) {
            var audio = new Audio();
            audio.src = song.song.path; // Đường dẫn đến tệp MP3
            audio.addEventListener("loadedmetadata", function () {
              // Thêm thuộc tính duration vào đối tượng song
              song.song.duration = $scope.formatTime(audio.duration);
              $scope.$apply(); // Cập nhật view Angular
            });
          });

          console.log("song_info Success", $scope.fullsongs);
        })
        .catch((error) => {
          console.log("song_info Error", error);
        });
    };

    // Hàm để định dạng thời gian từ giây sang mm:ss
    $scope.formatTime = function (time) {
      var minutes = Math.floor(time / 60);
      var seconds = Math.floor(time % 60);
      return (
        (minutes < 10 ? "0" : "") +
        minutes +
        ":" +
        (seconds < 10 ? "0" : "") +
        seconds
      );
    };
    $scope.find_songinfo();

    $scope.getAccount = function () {
      var urluser = `${host}/authorities/profile`;

      $http
        .get(urluser)
        .then((resp) => {
          $scope.userLogged = resp.data; // Gán dữ liệu profile từ API vào biến profileData
          console.log("user ok " + $scope.userLogged.fullname);
          var urlfavbyuser = `${host}/fav/${$scope.userLogged.username}`;
          $http
            .get(urlfavbyuser)
            .then((resp) => {
              $scope.favByUser = resp.data;
              $scope.fullsongs.forEach(function (song) {
                song.song.isFav = $scope.favByUser.some(
                  (favSong) => favSong.song.id === song.song.id
                );
              });
              console.log(urlfavbyuser);
              console.log("song fav by user ok 1 ", $scope.favByUser);
            })
            .catch((error) => {
              $scope.favByUser = null;
              console.log("song fav by user err 2 ", error);
            });
          $scope.getAccountPlaylist();
        })
        .catch((error) => {
          $scope.userLogged = null;
          console.log("user error", error);
        });
    };
    $scope.getAccount();

    $scope.favorite = function (song) {
      if ($scope.userLogged == null) {
        alert("Please log in to use this feature");
        return;
      }
      if (song.isFav) {
        var url = `${host}/fav/del/${song.id}/${$scope.userLogged.username}`;
        $http
          .delete(url)
          .then((resp) => {
            song.isFav = false;
            console.log("del fav success", resp);
          })
          .catch((error) => {
            console.log("del fav error", error);
          });
      } else {
        var url = `${host}/fav/add/${song.id}/${$scope.userLogged.username}`;
        $http
          .post(url)
          .then((resp) => {
            song.isFav = true;
            console.log("add fav success", resp);
          })
          .catch((error) => {
            console.log("add fav error", error);
          });
      }
    };

    $scope.findSongById = function (songId, callback) {
      var url = `${host}/song/${songId}`;
      $http
        .get(url)
        .then((resp) => {
          $scope.song_play = resp.data;
          // console.log("song_play Success", $scope.song_play);
          if (callback && typeof callback === "function") {
            callback(); // Execute the callback after fetching the song details
          }
        })
        .catch((error) => {
          // console.log("song_play Error", error);
        });
    };

    var sound;
    $scope.isPlaying = false;

    $scope.chooseSong = function (songId) {
      if (sound) {
        //kiểm tra sound có tồn tại không
        //nếu tồn tại thì dừng sound trước đó
        sound.pause();
        //set sound về null
        sound = null;
      }

      // console.log("SONG ID ====> " + id);
      $scope.findSongById(songId, function () {
        // console.log("Selected song: " + $scope.song_play.name);
        var songRow = document.getElementById(
          `table_fullsongs_${$scope.song_play.id}`
        );
        // Lấy thẻ <td> thứ ba trong thẻ <tr>
        var artistNameTd = songRow.getElementsByTagName("td")[2];

        // Lấy nội dung từ thẻ <td>
        var artistName = artistNameTd.textContent;

        // Gán nội dung vào phần tử có id 'artist-name'
        document.getElementById("artist-name").textContent = artistName;
        //sau khi tìm sound theo id thì thực hiện playMusic()
        $scope.playMusic();
      });
    };

    $scope.playMusic = function () {
      if (!sound) {
        sound = new Howl({
          // src: ["/asset/audio/IF ANDOR WHEN Ruel.mp3"],
          src: [`${$scope.song_play.path}`],
          format: ["mp3"],
          onplay: function () {
            $scope.isPlaying = true; // Đặt trạng thái là đang chạy khi nhạc được play
            $scope.$apply();
          },
          onpause: function () {
            $scope.isPlaying = false; // Đặt trạng thái là đã tạm dừng khi nhạc được pause
            $scope.$apply();
          },
          onstop: function () {
            $scope.isPlaying = false; // Đặt trạng thái là đã tạm dừng khi nhạc được stop
            $scope.$apply();
          },
          onend: function () {
            $scope.isPlaying = false;
            $scope.$apply();
          },
        });
      }

      if ($scope.isPlaying) {
        sound.pause(); // Nếu đang chạy, tạm dừng
      } else {
        sound.play(); // Nếu không chạy, play nhạc
      }
    };

    $scope.pauseMusic = function () {
      sound.pause();
      $scope.isPlaying = false; // Đặt trạng thái là đã tạm dừng khi nhạc được pause
    };

    $scope.stopMusic = function () {
      sound.stop();
      $scope.isPlaying = false; // Đặt trạng thái là đã tạm dừng khi nhạc được stop
    };

    $scope.currentTime = "0:00"; // Thời gian hiện tại
    $scope.duration = "0:00"; // Thời gian phát của bài hát

    $scope.formatTime = function (time) {
      var minutes = Math.floor(time / 60);
      var seconds = Math.floor(time % 60);
      return (
        (minutes < 10 ? "0" : "") +
        minutes +
        ":" +
        (seconds < 10 ? "0" : "") +
        seconds
      );
    };

    $scope.updateSeek = function () {
      // Kiểm tra xem có đối tượng (sound) có tồn tại không
      if (sound) {
        var newPosition = ($scope.seekValue / 100) * sound.duration();
        sound.seek(newPosition);
        $scope.currentTime = $scope.formatTime(sound.seek());
      } else {
        $scope.seek(0);
      }
    };

    $interval(function () {
      if (sound && $scope.isPlaying) {
        $scope.currentTime = $scope.formatTime(sound.seek());
        $scope.duration = $scope.formatTime(sound.duration());
        $scope.seekValue = (sound.seek() / sound.duration()) * 100;

        var bar2 = document.getElementById("bar2");
        var dot = document.getElementsByClassName("dot")[0];
        bar2.style.width = $scope.seekValue + "%";
        dot.style.left = $scope.seekValue + "%";
        //var music_curr = sound.seek();
        //var music_dur = sound.duration();

        //$scope.seekValue = (music_curr / music_dur) * 100;
        //console.log("CURRENT TIME ++ " + $scope.currentTime);
        // console.log("current TIME ++ " + sound.seek());
        //$scope.seekValue = (music_curr / music_dur) * 100;
        if (
          $scope.currentTime === $scope.duration ||
          sound.seek() === sound.duration() ||
          sound.onend
        ) {
          $scope.playNextSong();
        }
      }
    }, 1000);

    $scope.volume = 0.3;
    $scope.volBarWidth = "0%";
    $scope.volDotLeft = "0%";
    $scope.volBarWidth = $scope.volume * 100 + "%";
    $scope.volDotLeft = $scope.volume * 100 + "%";
    $scope.updateVolume = function () {
      if (sound) {
        sound.volume($scope.volume);

        // Cập nhật thanh âm lượng
        $scope.volBarWidth = $scope.volume * 100 + "%";
        $scope.volDotLeft = $scope.volume * 100 + "%";
      }
    };

    $scope.currentPage = 0; // Trang hiện tại
    $scope.pageSize = 5; // Số lượng bài hát trên mỗi trang

    // Tính số lượng trang
    $scope.numberOfPages = function () {
      return Math.ceil($scope.fullsongs.length / $scope.pageSize);
    };

    // Lấy chỉ số bắt đầu và kết thúc của bài hát trên trang hiện tại
    $scope.startFrom = function () {
      return $scope.currentPage * $scope.pageSize;
    };

    $scope.endAt = function () {
      return ($scope.currentPage + 1) * $scope.pageSize;
    };

    // Chuyển đến trang trước
    $scope.prevPage = function () {
      if ($scope.currentPage > 0) {
        $scope.currentPage--;
      }
    };

    // Chuyển đến trang tiếp theo
    $scope.nextPage = function () {
      if ($scope.currentPage < $scope.numberOfPages() - 1) {
        $scope.currentPage++;
      }
    };

    $scope.find_fullalbums = function () {
      var url = `${host}/albums`;
      $http
        .get(url)
        .then((resp) => {
          $scope.fullalbum = resp.data;
          // Tạo bản sao của mảng $scope.fullalbum
          $scope.fullalbum_newsort = $scope.fullalbum.slice(0);

          // Sắp xếp mảng mới theo thứ tự giảm dần của releaseYear
          $scope.fullalbum_newsort.sort(function (a, b) {
            return b.releaseYear - a.releaseYear;
          });

          // Tạo mảng $scope.fullalbum_newsort chỉ chứa tối đa 5 phần tử mới nhất
          $scope.fullalbum_newsort = $scope.fullalbum_newsort.slice(0, 5);

          console.log("full_album Success", $scope.fullalbum);
        })
        .catch((error) => {
          console.log("full_album Error", error);
        });
    };
    $scope.find_fullalbums();
    // PLAYLIST
    //LẤY TẤT CẢ PLAYLIST CỦA USER TỪ DATA
    $scope.getAllPlaylistByUser = function (userId, callback) {
      // var url = `${host}/playlist/creator/US000001`;
      var url = `${host}/playlist/creator/${userId}`;
      $http
        .get(url)
        .then((resp) => {
          $scope.playlistData = resp.data;
          $scope.playlistData2 = resp.data;
          console.log("PLAYLIST DATA ++ " + $scope.playlistData[0].name);
          console.log("getAllPlaylistByUser PLAYLIST USER ++ " + userId);
          if (callback && typeof callback === "function") {
            callback(); // Execute the callback after fetching the song details
          }
        })
        .catch((error) => {
          console.log("playlistSongData Error", error);
        });
    };
    //LẤY DỮ LIỆU song TỪ playlist  VÀ GÁN VÀO BIẾN playlistData
    $scope.getSongPlaylistByPlaylistId = function (playlistId, callback) {
      var url = `${host}/playlistsong/playlist/${playlistId}`;
      $http
        .get(url)
        .then((resp) => {
          $scope.playlistSong = resp.data;
          console.log("PLAYLIST SONG DATA ++ " + $scope.playlistSong);
          if (callback && typeof callback === "function") {
            callback(); // Execute the callback after fetching the song details
          }
        })
        .catch((error) => {
          console.log("playlistSongData Error", error);
        });
    };
    $scope.addNewPlaylist = function () {
      var playlistName = document.getElementById("inputName").value;

      if (!playlistName) {
        console.log("INPUT NULL ");
        return;
      }
      var url = `${host}/playlist`;
      var data = {
        name: playlistName,
        creator: $scope.account,
      };
      console.log("DATA ++ " + data.name);
      $http
        .post(url, data)
        .then((resp) => {
          console.log("Playlist created successfully:", resp.data);
        })
        .catch((error) => {
          console.log("accountdata Error", error);
        });
      $scope.tablePlaylistShow();
      $scope.getAccountPlaylist();
      var exitBtn = document.getElementById("exitButton").click();
    };
    // PLAYLIST
    /*USER*/
    $scope.getAccountPlaylist = function () {
      var url = `${host}/authorities/profile`;
      $http
        .get(url)
        .then((resp) => {
          $scope.account = resp.data;
          //LẤY USERNAME/ID CỦA USER
          console.log("ACCOUNT DATA ++ " + $scope.account.username);
          $scope.getAllPlaylistByUser($scope.account.username);
          return resp.data;
        })
        .catch((error) => {
          console.log("accountdata Error", error);
        });
    };
    $scope.addSongToPlaylist = function (playlist) {
      // $scope.getSongPlaylistByPlaylistId(playlist);
      console.log("PLAYLIST IN SONG TO PLAYLIST ++ " + playlist);
      console.log("SONG IN SONG TO PLAYLIST ++ " + $scope.song_play.name);
      var url = `${host}/playlistsong`;
      var data = {
        song: $scope.song_play,
        playlist: playlist,
      };
      console.log("DATA ++++==" + data.playlist);
      //check song and playlist
      $scope.checkSongNPlaylist = function (playlist, song) {
        console.log("CHEKCECKECJ PLAYLSIT---- " + playlist.id);
        console.log("CHEKCECKECJ SONG---- " + song.id);
        var url2 = `${host}/playlistsong/playlist/${playlist.id}/${song.id}`;
        $http
          .get(url2)
          .then((resp) => {
            $scope.checkSP = resp.data;
            console.log("CHECKING SONG PLAYLIST:", resp.data);
            return resp.data;
          })
          .catch((error) => {
            console.log("SONG IS NOT EXIST");
            console.log("CHECKING SONG PLAYLIST Error", error);
            return null;
          });
        // }
      };
      $scope.checkSongNPlaylist(data.playlist, data.song);

      // console.log("ad;slfhasl;df " +$scope.checkSongNPlaylist(data.playlist, data.song));
      console.log("CEHLEK " + $scope.checkSP);
      if (data.playlist != null && data.song != null) {
        $http
          .post(url, data)
          .then((resp) => {
            console.log("SONG TO PLAYLIST created sssfully:", resp.data);
            window.alert("ADD SONG TO PLAYLIST SUCCESSFULLY");
          })
          .catch((error) => {
            console.log("accountdata Error", error);
          });
      }
    };
    /*USER*/
  });
