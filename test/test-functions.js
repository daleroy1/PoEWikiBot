var expect = require("chai").expect;
var app = require("../app.js");

it("titleCase", function(done){
    expect(app.titleCase("the poet's pen")).to.equal("The Poet's Pen");
    expect(app.titleCase("THE POet'S PeN")).to.equal("The Poet's Pen");
    expect(app.titleCase("Hand OF thought and Motion")).to.equal("Hand of Thought and Motion");
    done();
});
