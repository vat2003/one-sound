let host = "http://localhost:8080/rest";
const app = angular.module("favApp", []);

app.controller("favCtrl", function ($scope, $http, $window) {
  $scope.profileData = {}; // Tạo biến mới để lưu trữ thông tin profile
  $scope.fullsongsFav;

  $scope.find_songinfo = function () {
    var url = `${host}/songsinfo/`;
    $http
      .get(url)
      .then((resp) => {
        $scope.fullsongsFav = resp.data;
        // Duyệt qua mỗi bài hát và xác định thời lượng
        $scope.fullsongsFav.forEach(function (song) {
          var audio = new Audio();
          audio.src = song.song.path; // Đường dẫn đến tệp MP3
          audio.addEventListener("loadedmetadata", function () {
            // Thêm thuộc tính duration vào đối tượng song
            song.song.duration = $scope.formatTime(audio.duration);
            $scope.$apply(); // Cập nhật view Angular
          });
        });

        console.log("song_info Success", $scope.fullsongsFav);
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
        $scope.imagePath = null;
        $scope.imagePath = resp.data.avatarUrl;

        console.log("user ok " + $scope.userLogged.fullname);
        var urlfavbyuser = `${host}/fav/${$scope.userLogged.username}`;
        $http
          .get(urlfavbyuser)
          .then((resp) => {
            $scope.favByUser = resp.data;
            $scope.fullsongsFav = $scope.fullsongsFav.filter(function (song) {
              // Kiểm tra xem bài hát có trong danh sách thích không
              var isFav = $scope.favByUser.some(function (favSong) {
                return favSong.song.id === song.song.id;
              });

              // Chỉ giữ lại những bài hát đã thích
              return isFav;
            });

            console.log("song fav by user ok 1 ", $scope.favByUser);
          })
          .catch((error) => {
            $scope.favByUser = null;
            console.log("song fav by user err 2 ", error);
          });
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
    if (
      confirm("Are you sure you want to remove this song from your favorites?")
    ) {
      var url = `${host}/fav/del/${song.id}/${$scope.userLogged.username}`;
      $http
        .delete(url)
        .then((resp) => {
          var index = $scope.fullsongsFav.findIndex(
            (s) => s.song.id == song.id
          );
          $scope.fullsongsFav.splice(index, 1);
          console.log("del fav success", resp);
        })
        .catch((error) => {
          console.log("del fav error", error);
        });
    }
  };

  $scope.chooseSong = function (song) {
    $window.location.href = `http://localhost:8080/album/detai/${song.album.id}?songId=${song.id}`;
  };
});
