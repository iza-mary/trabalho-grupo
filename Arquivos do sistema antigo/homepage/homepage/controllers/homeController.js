class HomeController {

    home(req, res) {
        res.render("home.ejs");
    }
}

module.exports = HomeController