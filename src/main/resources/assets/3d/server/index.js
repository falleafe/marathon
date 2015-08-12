var _ = require("underscore");
var express = require("express");
var nconf = require("nconf");

nconf.argv().env().defaults({
  apps: 4,
  tasks: 1000,
  health: 0.9,
  generations: 10
});

var generation = 0;
var app = express();

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/v2/apps", function (req, res) {
  generation++;
  console.log("GET /v2/apps", "generation", generation);

  var totalTasks = nconf.get("tasks");
  var pHealth = nconf.get("health");
  var generations = nconf.get("generations");

  var running = totalTasks;
  var staging = 0;
  var tasks = totalTasks;
  
  if (generation < generations) {
    running = Math.round(tasks * (generation / generations));
    staging = Math.round(tasks * (1 / generations));
    tasks = running + staging;
  }

  var healthy = Math.round(tasks * pHealth);
  var unhealthy = Math.round(tasks * (1 - pHealth));

  var apps = _.times(nconf.get("apps"), function (i) {
    return {
      id: "/app" + i,
      instances: tasks,
      tasksStaging: staging,
      tasksRunning: running,
      tasksUnhealthy: unhealthy,
      tasksHealthy: healthy
    };
  });
  console.log(JSON.stringify(apps[0]))
  res.json({ apps: apps });
});

app.get("/v2/apps/:appId/tasks", function (req, res) {
  var tasks = _.times(nconf.get("tasks"), function (i) {
    return {
      appId: "/" + req.params.appId,
      id: req.params.appId + "_instance" + i,
      host: "foo.bar.example.com"
    };
  });
  res.json({ tasks: tasks });
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Server listening at http://%s:%s", host, port);
});
