// ENTITY
Entity = function(param){
  var self = {
    x:0,
    y:0,
    z:0,
    spdX:0,
    spdY:0,
    id:Math.random()
  }

  if(param){
    if(param.x)
      self.x = param.x;
    if(param.y)
      self.y = param.y;
    if(param.z)
      self.z = param.z;
    if(param.id)
      self.id = param.id;
  }

  self.update = function(){
    self.updatePosition();
  }

  self.updatePosition = function(){
    self.x += self.spdX;
    self.y += self.spdY;
  }

  self.getDistance = function(pt){ // {x,y}
    return Math.sqrt(Math.pow(self.x-pt.x,2) + Math.pow(self.y-pt.y,2));
  }
  return self;
};

// BUILDING
Building = function(param){
  var self = Entity(param);
  self.owner = param.owner;
  self.house = param.house;
  self.kingdom = param.kingdom;
  self.type = param.type;
  self.built = param.built;
  self.loc = param.loc;
  self.plot = param.plot;
  self.walls = param.walls;
  self.topPlot = param.topPlot;
  self.mats = param.mats;
  self.req = param.req;
  self.hp = param.hp;
  self.occ = 0;

  self.getInitPack = function(){
    return {
      id:self.id,
      type:self.type,
      occ:self.occ,
      plot:self.plot,
      walls:self.walls
    }
  }

  self.getUpdatePack = function(){
    return {
      id:self.id,
      occ:self.occ
    }
  }

  Building.list[self.id] = self;

  initPack.building.push(self.getInitPack());

  return self;
}

Farm = function(param){
  var self = Building(param);
  self.mill = null;
  self.findMill = function(){
    for(var i in Building.list){
      var m = Building.list[i];
      var dist = getDistance({x:self.x,y:self.y},{x:m.x,y:m.y});
      if(m.type == 'mill' && dist <= 384 && m.house == self.house){
        Building.list[m.id].farms[self.id] = self.plot;
        for(var p in self.plot){
          Building.list[m.id].resources.push(self.plot[p]);
        }
        self.mill = m.id;
        console.log('Farm found mill ' + m.id);
        return;
      }
    }
  }
  self.findMill();
}

Mill = function(param){
  var self = Building(param);
  self.farms = {};
  self.tavern = null;
  self.resources = [];
  self.serfs = {};
  self.log = {};
  self.patrol = true;
  self.tally = function(){
    var f = 0;
    var s = 0;
    for(var i in self.farms){
      f++;
    }
    for(var i in self.serfs){
      s++;
    }
    var sr = s/(f*9);
    if(sr < 0.372){
      var grain = 0;
      if(self.tavern){
        if(Player.list[self.owner].house){
          var h = Player.list[self.owner].house;
          grain = House.list[h].stores.grain;
        } else {
          grain = Player.list[self.owner].stores.grain;
        }
        if(grain >= s){
          Building.list[self.tavern].newSerfs(self.id);
        }
      } else if(self.house >= 2 && self.house < 7){
        var hq = House.list[self.house].hq;
        grain = House.list[self.house].stores.grain;
        if(grain >= s){
          House.list[self.house].newSerfs(self.id,hq);
        }
      } else {
        console.log('Mill no tavern');
      }
    }
    for(var i in self.farms){
      var plot = self.farms[i];
      var count = 0;
      var add = [];
      for(var n in plot){
        var p = plot[n];
        var gt = getTile(0,p[0],p[1]);
        var gr = getTile(6,p[0],p[1]);
        if((gt == 8 && gr < 25)){
          count++;
        } else if((gt == 9 && gr < 50) || gt == 10){
          add.push(p);
        }
      }
      if(count == 9){
        for(var x in f.plot){
          self.resources.push(f.plot[x]);
        }
      } else {
        for(var x in add){
          self.resources.push(add[x]);
        }
      }
    }
  }
  self.findFarms = function(){
    for(var i in Building.list){
      var f = Building.list[i];
      var dist = getDistance({x:self.x,y:self.y},{x:f.x,y:f.y});
      if(f.type == 'farm' && dist <= 384 && f.house == self.house && !f.mill){
        self.farms[f.id] = f.plot;
        var count = 0;
        var add = [];
        for(var n in f.plot){
          var p = f.plot[n];
          var gt = getTile(0,p[0],p[1]);
          var gr = getTile(6,p[0],p[1]);
          if((gt == 8 && gr < 25)){
            count++;
          } else if((gt == 9 && gr < 50) || gt == 10){
            add.push(p);
          }
        }
        if(count == 9){
          for(var x in f.plot){
            self.resources.push(f.plot[x]);
          }
        } else {
          for(var x in add){
            self.resources.push(add[x]);
          }
        }
      } else if(f.type == 'tavern' && dist <= 1280 && f.house == self.house && !self.tavern){
        self.tavern = f.id;
        console.log('Mill found tavern ' + f.id);
      }
    }
  }
  self.findFarms();
}

Lumbermill = function(param){
  var self = Building(param);
  self.tavern = null;
  self.resources = [];
  self.serfs = {};
  self.log = {};
  self.patrol = true;
  self.tally = function(){
    var r = 0;
    var s = 0;
    for(var i in self.resources){
      r++;
    }
    for(var i in self.serfs){
      s++;
    }
    var sr = s/r;
    if(sr < 0.372){
      var wood = 0;
      if(self.tavern){
        if(Player.list[self.owner].house){
          var h = Player.list[self.owner].house;
          wood = House.list[h].stores.wood;
        } else {
          wood = Player.list[self.owner].stores.wood;
        }
        if(wood >= s){
          Building.list[self.tavern].newSerfs(self.id);
        }
      } else if(self.house >= 2 && self.house < 7){
        var hq = House.list[self.house].hq;
        wood = House.list[self.house].stores.wood;
        if(wood >= s){
          House.list[self.house].newSerfs(self.id,hq);
        }
      } else {
        console.log('Lumbermill no tavern');
      }
      self.getRes();
    }
  }
  self.findTavern = function(){
    for(var i in Building.list){
      var t = Building.list[i];
      var dist = getDistance({x:self.x,y:self.y},{x:t.x,y:t.y});
      if(t.type == 'tavern' && dist <= 1280 && t.house == self.house){
        self.tavern = t.id;
        console.log('Lumbermill found tavern ' + t.id);
      }
    }
  }
  self.getRes = function(){
    var loc = getLoc(self.x,self.y);
    var loc1 = [loc[0]+1,loc[1]];
    var area = getArea(loc,loc1,6);
    var res = [];
    for(var i in area){
      var r = area[i];
      var c = getCenter(r[0],r[1]);
      var dist = self.getDistance({x:c[0],y:c[1]});
      if(dist <= 384){
        var gt = getTile(0,r[0],r[1]);
        if(gt >= 1 && gt < 3){
          res.push(r);
        }
      }
    }
    self.resources = res;
    console.log('Lumbermill added ' + self.resources.length + ' resources');
  }
  self.getRes();
  self.findTavern();
}

Mine = function(param){
  var self = Building(param);
  self.tavern = null;
  self.cave = null;
  self.resources = [];
  self.serfs = {};
  self.log = {};
  self.patrol = true;
  self.tally = function(){
    var r = 0;
    var s = 0;
    for(var i in self.resources){
      r++;
    }
    for(var i in self.serfs){
      s++;
    }
    var sr = s/r;
    if(sr < 0.372){
      if(self.cave){
        var ore = 0;
        if(self.tavern){
          if(Player.list[self.owner].house){
            var h = Player.list[self.owner].house;
            ore = House.list[h].stores.ironore;
          } else {
            ore = Player.list[self.owner].stores.ironore;
          }
          if(ore >= s){
            Building.list[self.tavern].newSerfs(self.id);
          }
        } else if(self.house >= 2 && self.house < 7){
          var hq = House.list[self.house].hq;
          ore = House.list[self.house].stores.ironore;
          if(ore >= s){
            House.list[self.house].newSerfs(self.id,hq);
          }
        } else {
          console.log('Mine no tavern');
        }
      } else {
        var stone = 0;
        if(self.tavern){
          if(Player.list[self.owner].house){
            var h = Player.list[self.owner].house;
            stone = House.list[h].stores.stone;
          } else {
            stone = Player.list[self.owner].stores.stone;
          }
          if(stone >= s){
            Building.list[self.tavern].newSerfs(self.id);
          }
        } else if(self.house >= 2 && self.house < 7){
          var hq = House.list[self.house].hq;
          stone = House.list[self.house].stores.stone;
          if(stone >= s){
            House.list[self.house].newSerfs(self.id,hq);
          }
        } else {
          console.log('Mine no tavern');
        }
      }
    }
  }
  self.findTavern = function(){
    for(var i in Building.list){
      var t = Building.list[i];
      var dist = getDistance({x:self.x,y:self.y},{x:t.x,y:t.y});
      if(t.type == 'tavern' && dist <= 1280 && t.house == self.house){
        self.tavern = t.id;
        console.log('Mine found tavern ' + t.id);
      }
    }
  }
  self.getRes = function(){
    for(var i in caveEntrances){
      var cave = caveEntrances[i];
      var c = getCenter(cave[0],cave[1]);
      var dist = self.getDistance({x:c[0],y:c[1]});
      if(dist <= 384){
        self.cave = cave;
        console.log('Mine found a cave');
      }
    }
    if(self.cave){
      var loc = getLoc(self.x,self.y);
      var area = getArea(loc,self.cave,10);
      for(var i in area){
        var r = area[i];
        if(getTile(1,r[0],r[1]) >= 3){
          self.resources.push(r);
        }
      }
      console.log('Mine added ' + self.resources.length + ' resources');
    } else {
      var loc = getLoc(self.x,self.y);
      var loc1 = [loc[0]+1,loc[1]-1];
      var area = getArea(loc,loc1,6);
      for(var i in area){
        var r = area[i];
        var c = getCenter(r[0],r[1]);
        var dist = self.getDistance({x:c[0],y:c[1]});
        if(dist <= 384){
          var gt = getTile(0,r[0],r[1]);
          if(gt >= 4 && gt < 6){
            self.resources.push(r);
          }
        }
      }
      console.log('Mine added ' + self.resources.length + ' resources');
    }
  }
  self.getRes();
  self.findTavern();
}

Outpost = function(param){
  var self = Building(param);
  self.patrol = true;
  self.damage = 5;
}

Guardtower = function(param){
  var self = Building(param);
  self.patrol = true;
  self.damage = 10;
}

Tavern = function(param){
  var self = Building(param);
  self.market = null;
  self.patrol = true;
  self.findBuildings = function(){
    for(var i in Building.list){
      var b = Building.list[i];
      var dist = getDistance({x:self.x,y:self.y},{x:b.x,y:b.y});
      if(dist <= 1280 && b.house == self.house){
        if(b.type == 'mill' || b.type == 'lumbermill' || b.type == 'mine' || b.type == 'market'){
          if(!b.tavern){
            Building.list[i].tavern = self.id;
            console.log('Tavern found ' + b.type + ' ' + b.id);
          }
          if(b.type == 'market'){
            self.market = b.id;
            console.log('Tavern found market ' + b.id);
          }
        }
      }
    }
  }
  self.newSerfs = function(b){
    var building = Building.list[b];
    console.log('New serfs for ' + building.type);
    var loc = getLoc(self.x,self.y);
    var mLoc = getLoc(building.x,building.y);
    var area = getArea(loc,mLoc,5);
    var select = [];
    var wselect = [];
    for(var i in area){
      var t = area[i];
      var c = t[0];
      var r = t[1];
      var plot = [[c,r+1],[c+1,r+1],t,[c+1,r]];
      var perim = [[c-1,r-1],[c,r-1],[c+1,r-1],[c+2,r-1],[c-1,r],[c+2,r],[c-1,r+1],[c+2,r+1],[c-1,r+2],[c,r+2],[c+1,r+2],[c+2,r+2]];
      var walls = [[c,r-1],[c+1,r-1]];
      var count = 0;
      for(var n in plot){
        var p = getTile(0,plot[n][0],plot[n][1]);
        if((p >= 3 && p < 4) || p == 7){
          count++;
        }
      }
      var ex = perim[2];
      if(count == 4 && getTile(0,ex[0],ex[1]) != 0){
        count = 0;
        for(var n in perim){
          var m = getTile(0,perim[n][0],perim[n][1]);
          var tm = getTile(5,perim[n][0],perim[n][1]);
          if(m != 11 &&
          m != 11.5 &&
          m != 12 &&
          m != 12.5 &&
          m != 13 &&
          m != 14 &&
          m != 15 &&
          m != 16 &&
          m != 17 &&
          m != 19 &&
          m != 20 &&
          m != 20.5 &&
          (tm == 0 || tm == 'dock6' || tm == 'dock7' || tm == 'dock8')){
            count++;
          }
        }
        if(count == 12){
          select.push(plot);
          wselect.push(walls);
        }
      }
    }
    if(select.length > 0){
      var rand = Math.floor(Math.random() * select.length);
      var plot = select[rand];
      var walls = wselect[rand];
      for(var i in plot){
        var p = plot[i];
        tileChange(0,p[0],p[1],11);
        tileChange(6,p[0],p[1],0);
      }
      mapEdit();
      var center = getCoords(plot[3][0],plot[3][1]);
      var id = Math.random();
      Building({
        id:id,
        owner:building.owner,
        house:Player.list[building.owner].house,
        kingdom:Player.list[building.owner].kingdom,
        x:center[0],
        y:center[1],
        z:0,
        type:'hut',
        built:false,
        plot:plot,
        walls:walls,
        topPlot:null,
        mats:{
          wood:30,
          stone:0
        },
        req:5,
        hp:150
      })
      var s1 = Math.random();
      var sp1 = self.plot[13]
      var c1 = getCenter(sp1[0],sp1[1]);
      var s2 = Math.random();
      var sp2 = self.plot[14];
      var c2 = getCenter(sp2[0],sp2[1]);
      var work = {hq:b,spot:null};
      if(s1 > 0.4){
        SerfM({
          id:s1,
          name:randomName('m'),
          x:c1[0],
          y:c1[1],
          z:2,
          house:Player.list[self.owner].house,
          kingdom:Player.list[self.owner].kingdom,
          home:{z:2,loc:sp1},
          work:{hq:b,spot:null},
          hut:id,
          tavern:self.id
        });
      } else {
        SerfF({
          id:s1,
          name:randomName('f'),
          x:c1[0],
          y:c1[1],
          z:2,
          house:Player.list[self.owner].house,
          kingdom:Player.list[self.owner].kingdom,
          home:{z:2,loc:sp1},
          hut:id,
          tavern:self.id
        });
      }
      if(s2 > 0.6){
        SerfM({
          id:s2,
          name:randomName('m'),
          x:c2[0],
          y:c2[1],
          z:2,
          house:Player.list[self.owner].house,
          kingdom:Player.list[self.owner].kingdom,
          home:{z:2,loc:sp2},
          work:{hq:b,spot:null},
          hut:id,
          tavern:self.id
        });
      } else {
        SerfF({
          id:s2,
          name:randomName('f'),
          x:c2[0],
          y:c2[1],
          z:2,
          house:Player.list[self.owner].house,
          kingdom:Player.list[self.owner].kingdom,
          home:{z:2,loc:sp2},
          hut:id,
          tavern:self.id
        });
      }
      if(Player.list[s1].sex == 'm'){
        Building.list[b].serfs[s1] = s1;
        Player.list[s1].work = {hq:b,spot:null};
      } else {
        if(building.type == 'mill'){
          Building.list[b].serfs[s1] = s1;
          Player.list[s1].work = {hq:b,spot:null};
        }
      }
      if(Player.list[s2].sex == 'm'){
        Building.list[b].serfs[s2] = s2;
        Player.list[s2].work = {hq:b,spot:null};
      } else {
        if(building.type == 'mill'){
          Building.list[b].serfs[s2] = s2;
          Player.list[s2].work = {hq:b,spot:null};
        }
      }
      self.occ += 2;
      console.log('Serfs have spawned in the tavern: ' + Building.list[b].type);
    }
  }
  self.findBuildings();
}

Monastery = function(param){
  var self = Building(param);
  self.patrol = true;
}

Market = function(param){
  var self = Building(param);
  self.patrol = true;
  self.findTavern = function(){
    for(var i in Building.list){
      var t = Building.list[i];
      var dist = getDistance({x:self.x,y:self.y},{x:t.x,y:t.y});
      if(t.type == 'tavern' && dist <= 1280){
        self.tavern = t.id;
        if(!t.market){
          Building.list[i].market = self.id;
        }
      }
    }
  }
  self.orderbook = {};
  self.findTavern();
}

Stable = function(param){
  var self = Building(param);
  self.patrol = true;
  self.horses = 5;
}

Dock = function(param){
  var self = Building(param);
  self.patrol = true;
}

Garrison = function(param){
  var self = Building(param);
  self.queue = [];
  self.timer = 1000;
  self.patrol = true;
  self.update = function(){
    if(self.queue.length > 0){
      if(self.timer > 0){
        self.timer--;
        if(self.timer == 0){
          var sp = self.plot[7];
          if(self.queue[0] == 'footsoldier'){
            Footsoldier({
              x:sp[0],
              y:sp[1],
              z:1,
              house:Building.list[b].house,
              kingdom:Building.list[b].kingdom,
              home:{
                z:1,
                loc:[sp[0],sp[1]]
              }
            });
          } else if(self.queue[0] == 'skirmisher'){
            Skirmisher({
              x:sp[0],
              y:sp[1],
              z:1,
              house:Building.list[b].house,
              kingdom:Building.list[b].kingdom,
              home:{
                z:1,
                loc:[sp[0],sp[1]]
              }
            });
          } else if(self.queue[0] == 'cavalier'){
            Cavalier({
              x:sp[0],
              y:sp[1],
              z:1,
              house:Building.list[b].house,
              kingdom:Building.list[b].kingdom,
              home:{
                z:1,
                loc:[sp[0],sp[1]]
              }
            });
          }
        }
      }
    }
  }
}

Forge = function(param){
  var self = Building(param);
  self.patrol = true;
  self.blacksmith = null;
}

Gate = function(param){
  var self = Building(param);
  self.patrol = true;
  self.open = function(){

  }
  self.close = function(){

  }
}

Stronghold = function(param){
  var self = Building(param);
  self.patrol = true;
  self.damage = 10;
}

Building.list = {};

Building.update = function(){
  var pack = [];
  for(var i in Building.list){
    var building = Building.list[i];
    if(building.update){
      building.update();
    }
    pack.push(building.getUpdatePack());
  }
  return pack;
}

Building.getAllInitPack = function(){
  var buildings = [];
  for(var i in Building.list)
    buildings.push(Building.list[i].getInitPack());
  return buildings;
}

// CHARACTER
Character = function(param){
  var self = Entity(param);
  self.zone = null;
  self.zGrid = null;
  self.type = 'npc';
  self.name = null;
  self.sex = param.sex; // 'm' or 'f'
  self.house = param.house;
  self.kingdom = param.kingdom;
  self.home = param.home; // {z,loc}
  self.class = null;
  self.rank = null;
  self.gear = {
    head:null,
    armor:null,
    weapon:null,
    weapon2:null,
    accessory:null
  }
  self.inventory = Inventory();
  self.stores = {
    grain:0,
    wood:0,
    stone:0,
    ironore:0,
    iron:0,
    silverore:0,
    silver:0,
    goldore:0,
    gold:0,
    diamond:0
  }
  self.mounted = false;
  self.ranged = false;
  self.military = false;
  self.cleric = false;
  self.stealthed = false;
  self.revealed = false;
  self.spriteSize = tileSize;
  self.facing = 'down';
  self.pressingRight = false;
  self.pressingLeft = false;
  self.pressingUp = false;
  self.pressingDown = false;
  self.pressingAttack = false;
  self.innaWoods = false;
  self.onMtn = false;
  self.hasTorch = false;
  self.working = false;
  self.chopping = false;
  self.mining = false;
  self.farming = false;
  self.building = false;
  self.fishing = false;
  self.baseSpd = 4;
  self.maxSpd = 4;
  self.drag = 1;
  self.idleTime = 0;
  self.idleRange = 1000;
  self.wanderRange = 256;
  self.aggroRange = 256;
  self.actionCooldown = 0;
  self.attackCooldown = 0;
  self.hp = 100;
  self.hpMax = 100;
  self.spirit = null;
  self.spiritMax = null;
  self.strength = 1;
  self.damage = 0;
  self.fortitude = 0;
  self.attackrate = 50;
  self.dexterity = 1;
  self.toRemove = false;
  self.die = function(report){ // report {id,cause}
    if(report.id){
      if(Player.list[report.id]){
        Player.list[report.id].combat.target = null;
        console.log(Player.list[report.id].class + ' has killed ' + self.class);
      } else {
        console.log(self.class + ' has ' + report.cause);
      }
    }
    if(self.house && self.house.type == 'npc'){
      var units = House.list[self.house].military.scout.units;
      if(units.length > 0){
        if(units.includes(self.id)){
          House.list[self.house].military.scout.units.remove(units.indexOf(self.id),1);
          for(var i in Item.list){
            var itm = Item.list[i];
            if(itm.type == 'Banner' && itm.parent == self.id){
              Item.list[itm.id].toRemove = true;
              Item.list[itm.id].toUpdate = true;
            }
          }
        }
      }
      House.list[self.house].respawn(self.class,self.home);
    }
    self.toRemove = true;
  }

  // idle = walk around
  // patrol = walk between targets
  // escort = follow and protect target
  // raid = attack all enemies en route to target
  self.mode = 'idle';

  // combat = eliminate target
  // return = return to previous location and activity
  // flee = disengage and escape from target
  self.action = null;

  self.lastLoc = null; // {z,loc}

  self.dialogue = {};

  self.friends = [];
  self.enemies = [];

  self.combat = {
    target:null,
    targetDmg:0,
    altDmg:0
  }

  self.escort = {
    target:null,
    escorting:[] // unit ids
  }

  self.scout = {
    target:null,
    reached:false,
    return:null,
    enemyLoc:null,
    timer:100
  }

  self.guard = {
    point:null, // {z,loc}
    facing:null
  }

  self.raid = {
    target:null
  }

  self.path = null;
  self.pathCount = 0;
  self.pathEnd = null;
  self.followPoint = null;
  self.caveEntrance = null;

  self.move = function(target){ // [c,r]
    self.working = false;
    self.farming = false;
    self.chopping = false;
    self.mining = false;
    self.path = [target];
  }

  self.prevLoc = null; // [c,r]
  self.stuck = 0;

  self.attack = function(dir){
    self.pressingAttack = true;
    self.working = false;
    self.chopping = false;
    self.mining = false;
    self.farming = false;
    self.building = false;
    self.fishing = false;
    var dmg = self.damage;
    if(self.type == 'player'){
      dmg = self.gear.weapon.dmg;
    }
    if(dir == 'down'){
      for(var i in self.zGrid){
        var zc = self.zGrid[i][0];
        var zr = self.zGrid[i][1];
        if(zc < 64 && zc > -1 && zr < 64 && zr > -1){
          for(var n in zones[zr][zc]){
            var p = Player.list[zones[zr][zc][n]];
            if(p){
              var loc = getLoc(self.x,self.y);
              var dLoc = [loc[0],loc[1]+1];
              var pLoc = getLoc(p.x,p.y);
              if(pLoc.toString() == dLoc.toString()){
                if(allyCheck(self.id,p.id) < 1 || self.friendlyfire){
                  Player.list[p.id].hp -= dmg - p.fortitude;
                  Player.list[p.id].working = false;
                  Player.list[p.id].chopping = false;
                  Player.list[p.id].mining = false;
                  Player.list[p.id].farming = false;
                  Player.list[p.id].building = false;
                  Player.list[p.id].fishing = false;
                  if(!p.combat.target){
                    Player.list[p.id].combat.target = self.id;
                  }
                  Player.list[p.id].action = 'combat';
                  Player.list[p.id].stealthed = false;
                  Player.list[p.id].revealed = false;
                  self.stealthed = false;
                  self.revealed = false;
                  self.combat.target = p.id;
                  self.action = 'combat';
                  console.log(self.class + ' attacks ' + p.class);
                }
                // player death & respawn
                if(Player.list[p.id].hp <= 0){
                  Player.list[p.id].die({id:self.id,cause:'melee'});
                }
              }
            }
          }
        }
      }
    } else if(dir == 'up'){
      for(var i in self.zGrid){
        var zc = self.zGrid[i][0];
        var zr = self.zGrid[i][1];
        if(zc < 64 && zc > -1 && zr < 64 && zr > -1){
          for(var n in zones[zr][zc]){
            var p = Player.list[zones[zr][zc][n]];
            if(p){
              var loc = getLoc(self.x,self.y);
              var uLoc = [loc[0],loc[1]-1];
              var pLoc = getLoc(p.x,p.y);
              if(pLoc.toString() == uLoc.toString()){
                if(allyCheck(self.id,p.id) < 1 || self.friendlyfire){
                  Player.list[p.id].hp -= dmg - p.fortitude;
                  Player.list[p.id].working = false;
                  Player.list[p.id].chopping = false;
                  Player.list[p.id].mining = false;
                  Player.list[p.id].farming = false;
                  Player.list[p.id].building = false;
                  Player.list[p.id].fishing = false;
                  if(!p.combat.target){
                    Player.list[p.id].combat.target = self.id;
                  }
                  Player.list[p.id].action = 'combat';
                  Player.list[p.id].stealthed = false;
                  Player.list[p.id].revealed = false;
                  self.stealthed = false;
                  self.revealed = false;
                  self.combat.target = p.id;
                  self.action = 'combat';
                  console.log(self.class + ' attacks ' + p.class);
                }
                // player death & respawn
                if(Player.list[p.id].hp <= 0){
                  Player.list[p.id].die({id:self.id,cause:'melee'});
                }
              }
            }
          }
        }
      }
    } else if(dir == 'left'){
      for(var i in self.zGrid){
        var zc = self.zGrid[i][0];
        var zr = self.zGrid[i][1];
        if(zc < 64 && zc > -1 && zr < 64 && zr > -1){
          for(var n in zones[zr][zc]){
            var p = Player.list[zones[zr][zc][n]];
            if(p){
              var loc = getLoc(self.x,self.y);
              var lLoc = [loc[0]-1,loc[1]];
              var pLoc = getLoc(p.x,p.y);
              if(pLoc.toString() == lLoc.toString()){
                if(allyCheck(self.id,p.id) < 1 || self.friendlyfire){
                  Player.list[p.id].hp -= dmg - p.fortitude;
                  Player.list[p.id].working = false;
                  Player.list[p.id].chopping = false;
                  Player.list[p.id].mining = false;
                  Player.list[p.id].farming = false;
                  Player.list[p.id].building = false;
                  Player.list[p.id].fishing = false;
                  if(!p.combat.target){
                    Player.list[p.id].combat.target = self.id;
                  }
                  Player.list[p.id].action = 'combat';
                  Player.list[p.id].stealthed = false;
                  Player.list[p.id].revealed = false;
                  self.stealthed = false;
                  self.revealed = false;
                  self.combat.target = p.id;
                  self.action = 'combat';
                  console.log(self.class + ' attacks ' + p.class);
                }
                // player death & respawn
                if(Player.list[p.id].hp <= 0){
                  Player.list[p.id].die({id:self.id,cause:'melee'});
                }
              }
            }
          }
        }
      }
    } else if(dir == 'right'){
      for(var i in self.zGrid){
        var zc = self.zGrid[i][0];
        var zr = self.zGrid[i][1];
        if(zc < 64 && zc > -1 && zr < 64 && zr > -1){
          for(var n in zones[zr][zc]){
            var p = Player.list[zones[zr][zc][n]];
            if(p){
              var loc = getLoc(self.x,self.y);
              var rLoc = [loc[0]+1,loc[1]];
              var pLoc = getLoc(p.x,p.y);
              if(pLoc.toString() == rLoc.toString()){
                if(allyCheck(self.id,p.id) < 1 || self.friendlyfire){
                  Player.list[p.id].hp -= dmg - p.fortitude;
                  Player.list[p.id].working = false;
                  Player.list[p.id].chopping = false;
                  Player.list[p.id].mining = false;
                  Player.list[p.id].farming = false;
                  Player.list[p.id].building = false;
                  Player.list[p.id].fishing = false;
                  if(!p.combat.target){
                    Player.list[p.id].combat.target = self.id;
                  }
                  Player.list[p.id].action = 'combat';
                  Player.list[p.id].stealthed = false;
                  Player.list[p.id].revealed = false;
                  self.stealthed = false;
                  self.revealed = false;
                  self.combat.target = p.id;
                  self.action = 'combat';
                  console.log(self.class + ' attacks ' + p.class);
                }
                // player death & respawn
                if(Player.list[p.id].hp <= 0){
                  Player.list[p.id].die({id:self.id,cause:'melee'});
                }
              }
            }
          }
        }
      }
    }
    self.attackCooldown = self.attackrate/self.dexterity;
    setTimeout(function(){
      self.pressingAttack = false;
    },250);
  }

  self.shootArrow = function(angle){
    self.pressingAttack = true;
    self.working = false;
    self.chopping = false;
    self.mining = false;
    self.farming = false;
    self.building = false;
    self.fishing = false;
    // add variable inaccuracy to angle?
    Arrow({
      parent:self.id,
      angle:angle,
      x:self.x,
      y:self.y,
      z:self.z
    });
    self.attackCooldown = (self.attackrate*2)/self.dexterity;
    setTimeout(function(){
      self.pressingAttack = false;
    },250);
  }

  self.lightTorch = function(torchId){
    if(self.z != -3){
      LitTorch({
        id:torchId,
        parent:self.id,
        x:self.x,
        y:self.y,
        z:self.z,
        qty:1
      })
      self.hasTorch = torchId;
    }
  }

  self.rightBlocked = false;
  self.leftBlocked = false;
  self.upBlocked = false;
  self.downBlocked = false;

  self.return = function(target){ // target = {z:z,loc:[c,r]}
    var loc = getLoc(self.x,self.y);
    if(!self.path){
      if(target){
        self.moveTo(target.z,target.loc[0],target.loc[1]);
      } else if(self.lastLoc){
        self.moveTo(self.lastLoc.z,self.lastLoc.loc[0],self.lastLoc.loc[1]);
      } else if(self.tether){
        self.moveTo(self.tether.z,self.tether.loc[0],self.tether.loc[1]);
      } else if(self.home){
        self.moveTo(self.home.z,self.home.loc[0],self.home.loc[1]);
      }
    }
  }

  self.reposition = function(loc,tLoc){
    var dir = self.calcDir(loc,tLoc);
    if(dir != self.lastDir && dir !== 'd' && dir !== 'u' && dir !== 'l' && dir != 'r'){
      self.lastDir = dir;
    }
    if(dir == 'ul'){
      var d = [loc[0],loc[1]+1];
      if(isWalkable(self.z,d[0],d[1])){
        self.move(d);
      } else {
        var r = [loc[0]+1,loc[1]];
        if(isWalkable(self.z,r[0],r[1])){
          self.move(r);
        }
      }
    } else if(dir == 'lu'){
      var r = [loc[0]+1,loc[1]];
      if(isWalkable(self.z,r[0],r[1])){
        self.move(r);
      } else {
        var d = [loc[0],loc[1]+1];
        if(isWalkable(self.z,d[0],d[1])){
          self.move(d);
        }
      }
    } else if(dir == 'l'){
      var r = [loc[0]+1,loc[1]];
      if(isWalkable(self.z,r[0],r[1])){
        self.move(r);
      } else {
        if(self.lastDir == 'dl' || self.lastDir == 'ld'){
          var u = [loc[0],loc[1]-1];
          if(isWalkable(self.z,u[0],u[1])){
            self.move(u);
          }
        } else {
          var d = [loc[0],loc[1]+1];
          if(isWalkable(self.z,d[0],d[1])){
            self.move(d);
          }
        }
      }
    } else if(dir == 'u'){
      var d = [loc[0],loc[1]+1];
      if(isWalkable(self.z,d[0],d[1])){
        self.move(d);
      } else {
        if(self.lastDir == 'ul' || self.lastDir == 'lu'){
          var r = [loc[0]+1,loc[1]];
          if(isWalkable(self.z,r[0],r[1])){
            self.move(r);
          } else {
            var l = [loc[0]-1,loc[1]];
            if(isWalkable(self.z,l[0],l[1])){
              self.move(l);
            }
          }
        }
      }
    } else if(dir == 'ld'){
      var r = [loc[0]+1,loc[1]];
      if(isWalkable(self.z,r[0],r[1])){
        self.move(r);
      } else {
        var u = [loc[0],loc[1]-1];
        if(isWalkable(self.z,u[0],u[1])){
          self.move(u);
        }
      }
    } else if(dir == 'dl'){
      var u = [loc[0],loc[1]-1];
      if(isWalkable(self.z,u[0],u[1])){
        self.move(u);
      } else {
        var r = [loc[0]+1,loc[1]];
        if(isWalkable(self.z,r[0],r[1])){
          self.move(r);
        }
      }
    } else if(dir == 'd'){
      var u = [loc[0],loc[1]-1];
      if(isWalkable(self.z,u[0],u[1])){
        self.move(u);
      } else {
        if(self.lastDir == 'dl' || self.lastDir == 'ld'){
          var r = [loc[0]+1,loc[1]];
          if(isWalkable(self.z,r[0],r[1])){
            self.move(r);
          }
        } else {
          var l = [loc[0]-1,loc[1]];
          if(isWalkable(self.z,l[0],l[1])){
            self.move(l);
          }
        }
      }
    } else if(dir == 'rd'){
      var l = [loc[0]-1,loc[1]];
      if(isWalkable(self.z,l[0],l[1])){
        self.move(l);
      } else {
        var u = [loc[0],loc[1]-1];
        if(isWalkable(self.z,u[0],u[1])){
          self.move(u);
        }
      }
    } else if(dir == 'dr'){
      var u = [loc[0],loc[1]-1];
      if(isWalkable(self.z,u[0],u[1])){
        self.move(u);
      } else {
        var l = [loc[0]-1,loc[1]];
        if(isWalkable(self.z,l[0],l[1])){
          self.move(l);
        }
      }
    } else if(dir == 'ru'){
      var l = [loc[0]-1,loc[1]];
      if(isWalkable(self.z,l[0],l[1])){
        self.move(l);
      } else {
        var d = [loc[0],loc[1]+1];
        if(isWalkable(self.z,d[0],d[1])){
          self.move(d);
        }
      }
    } else if(dir == 'ur'){
      var d = [loc[0],loc[1]+1];
      if(isWalkable(self.z,d[0],d[1])){
        self.move(d);
      } else {
        var l = [loc[0]-1,loc[1]];
        if(isWalkable(self.z,l[0],l[1])){
          self.move(l);
        }
      }
    } else if(dir == 'r'){
      var l = [loc[0]-1,loc[1]];
      if(isWalkable(self.z,l[0],l[1])){
        self.move(l);
      } else {
        if(self.lastDir == 'dr' || self.lastDir == 'rd'){
          var u = [loc[0],loc[1]-1];
          if(isWalkable(self.z,u[0],u[1])){
            self.move(u);
          } else {
            var d = [loc[0],loc[1]+1];
            if(isWalkable(self.z,d[0],d[1])){
              self.move(d);
            }
          }
        }
      }
    }
  }

  self.getAngle = function(x,y){
    var dx = x - self.x;
    var dy = y - self.y;
    var angle = Math.atan2(dy,dx) / Math.PI * 180;
    return angle;
  }

  self.zoneCheck = function(){
    var loc = getLoc(self.x,self.y);
    var zn = self.zone;
    var zc = Math.floor(loc[0]/8);
    var zr = Math.floor(loc[1]/8);

    if(!zn){
      self.zone = [zc,zr];
      zones[zr][zc][self.id = self.id];
      self.zGrid = [
        [zc-1,zr-1],[zc,zr-1],[zc+1,zr-1],
        [zc-1,zr],self.zone,[zc+1,zr],
        [zc-1,zr+1],[zc,zr+1],[zc+1,zr+1]
      ];
    } else if(zn != [zc,zr]){
      delete zones[zn[1]][zn[0]][self.id];
      zones[zr][zc][self.id] = self.id;
      self.zone = [zc,zr];
      self.zGrid = [
        self.zone,[zc-1,zr-1],[zc,zr-1],
        [zc+1,zr-1],[zc-1,zr],[zc+1,zr],
        [zc-1,zr+1],[zc,zr+1],[zc+1,zr+1]
      ];
    }
  }

  self.stealthCheck = function(p){
    if(p.stealthed){
      var loc = getLoc(self.x,self.y);
      var pLoc = getLoc(p.x,p.y);
      if(self.facing == 'up'){
        var uLoc = [loc[0],loc[1]-1];
        if(pLoc.toString() == uLoc.toString()){
          Player.list[p.id].revealed = true;
        }
      } else if(self.facing == 'right'){
        var rLoc = [loc[0]+1,loc[1]];
        if(pLoc.toString() == rLoc.toString()){
          Player.list[p.id].revealed = true;
        }
      } else if(self.facing == 'down'){
        var dLoc = [loc[0],loc[1]+1];
        if(pLoc.toString() == dLoc.toString()){
          Player.list[p.id].revealed = true;
        }
      } else if(self.facing == 'left'){
        var lLoc = [loc[0]-1,loc[1]];
        if(pLoc.toString() == lLoc.toString()){
          Player.list[p.id].revealed = true;
        }
      }
    }
  }

  self.revealCheck = function(){
    if(self.z == 0 || self.z == 1 || self.z == 2){
      if(!nightfall && !self.innaWoods){
        self.revealed = true;
        return;
      }
    }
    for(i in Light.list){
      var light = Light.list[i];
      if(self.z == light.z){
        var d = self.getDistance({x:light.x,y:light.y});
        if(d <= light.radius * 50){
          self.revealed = true;
          return;
        }
      }
    }
    self.revealed = false;
  }

  self.checkAggro = function(){
    for(var i in self.zGrid){
      var zc = self.zGrid[i][0];
      var zr = self.zGrid[i][1];
      if(zc < 64 && zc > -1 && zr < 64 && zr > -1){
        for(var n in zones[zr][zc]){
          var p = Player.list[zones[zr][zc][n]];
          if(p && p.z == self.z){
            var pDist = self.getDistance({
              x:p.x,
              y:p.y
            });
            if(pDist <= self.aggroRange){ // in aggro range
              var ally = allyCheck(self.id,p.id);
              if(self.innaWoods == p.innaWoods || (self.innaWoods && !p.innaWoods)){ // both in woods, both out of woods or in woods and they are not
                if(ally <= 0){ // is neutral or enemy
                  self.stealthCheck(p);
                  if(!Player.list[p.id].stealthed || Player.list[p.id].revealed){ // is not stealthed or is revealed
                    if(ally == -1){ // is enemy
                      self.combat.target = p.id;
                      if(self.hp < (self.hpMax * 0.1) || self.unarmed){
                        self.action = 'flee';
                      } else {
                        if(self.mode == 'patrol' && !self.lastLoc){
                          var loc = getLoc(self.x,self.y);
                          self.lastLoc = {z:self.z,loc:loc};
                        }
                        self.action = 'combat';
                      }
                      if(p.type == 'npc' && pDist <= p.aggroRange && !p.action){
                        Player.list[p.id].combat.target = self.id;
                        Player.list[p.id].action = 'combat';
                      }
                    } else {
                      continue;
                    }
                  }
                }
              } else { // not in woods and they are
                if(ally == -1){ // is enemy
                  if(p.type == 'npc' && pDist <= p.aggroRange){
                    if(!self.stealthed){
                      Player.list[p.id].combat.target = self.id;
                      Player.list[p.id].action = 'combat';
                    } else if(!self.revealed){
                      Player.list[p.id].combat.target = self.id;
                      Player.list[p.id].action = 'combat';
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  self.calcDir = function(loc,tLoc){
    var c = tLoc[0] - loc[0];
    var r = tLoc[1] - loc[1];
    if(c == 0 && r == 0){
      return 'c';
    } else if(c >= 0 && r >= 0){ // down/right
      if(c >= r){
        if(r > 0){
          return 'rd';
        } else {
          return 'r';
        }
      } else {
        if(c > 0){
          return 'dr';
        } else {
          return 'd';
        }
      }
    } else if(c >= 0 && r < 0){ // up/right
      r *= -1;
      if(c >= r){
        if(r > 0){
          return 'ru';
        } else {
          return 'r';
        }
      } else {
        if(c > 0){
          return 'ur';
        } else {
          return 'u';
        }
      }
    } else if(c < 0 && r < 0){ // up/left
      if(c <= r){
        return 'lu';
      } else {
        return 'ul';
      }
    } else if(c < 0 && r >= 0){ // down/left
      c *= -1;
      if(c >= r){
        if(r > 0){
          return 'ld';
        } else {
          return 'l';
        }
      } else {
        if(c > 0){
          return 'dl';
        } else {
          return 'd';
        }
      }
    }
  }

  self.lastDir = null;
  self.lastTarget = null;

  self.moveTo = function(tz,tc,tr){
    var loc = getLoc(self.x,self.y);
    if(!self.prevLoc){
      self.prevLoc = loc;
    }
    var cen = getCenter(loc[0],loc[1]);
    var tLoc = [tc,tr];
    if(loc.toString() != tLoc.toString()){
      if(tz == self.z){
        if(self.z == -1){
          //
        } else if(self.z == -2){
          var b = getBuilding(cen[0],cen[1]);
          var tcen = getCenter(tLoc[0],tLoc[1]);
          var tb = getBuilding(tcen[0],tcen[1]);
          if(b !== tb){
            tLoc = Building.list[tb].dstairs;
          }
        } else if(self.z == 1){
          var b = getBuilding(cen[0],cen[1]);
          var tcen = getCenter(tLoc[0],tLoc[1]);
          var tb = getBuilding(tcen[0],tcen[1]);
          if(b !== tb){
            tLoc = [Building.list[tb].entrance[0],Building.list[tb].entrance[1]+1];
          }
        } else if(self.z == 2){
          var b = getBuilding(cen[0],cen[1]);
          var tcen = getCenter(tLoc[0],tLoc[1]);
          var tb = getBuilding(tcen[0],tcen[1]);
          if(b !== tb){
            tLoc = Building.list[tb].ustairs;
          }
        } else if(self.z == -3) {
          //
        }
      } else {
        if(self.z == 0){
          if(tz == 1 || tz == 2 || tz == -2){
            var tcen = getCenter(tLoc[0],tLoc[1]);
            var tb = getBuilding(tcen[0],tcen[1]);
            tLoc = Building.list[tb].entrance;
          }
        } else if(self.z == -1){
          tLoc = [self.caveEntrance[0],self.caveEntrance[1]+1];
        } else if(self.z == -2){
          var b = getBuilding(cen[0],cen[1]);
          tLoc = Building.list[b].dstairs;
        } else if(self.z == 1){
          var b = getBuilding(cen[0],cen[1]);
          if(tz == 0 || tz == -1){
            tLoc = [Building.list[b].entrance[0],Building.list[b].entrance[1]+1];
          } else {
            var tcen = getCenter(tLoc[0],tLoc[1]);
            var tb = getBuilding(tcen[0],tcen[1]);
            if(b == tb){
              if(tz == 2){
                tLoc = [Building.list[b].ustairs];
              } else if(tz == -2){
                tLoc = [Building.list[b].dstairs];
              }
            } else {
              tLoc = [Building.list[b].entrance[0],Building.list[b].entrance[1]+1];
            }
          }
        } else if(self.z == 2){
          var b = getBuilding(cen[0],cen[1]);
          tLoc = Building.list[b].ustairs;
        } else if(self.z == -3){
          //
        }
      }
    }
    var dir = self.calcDir(loc,tLoc);
    if(dir != self.lastDir){
      self.lastDir = dir;
    }
    var u = [loc[0],loc[1]-1];
    var d = [loc[0],loc[1]+1];
    var l = [loc[0]-1,loc[1]];
    var r = [loc[0]+1,loc[1]];
    // door or cave in path handling
    var doorUp = false;
    var doorLeft = false;
    var doorRight = false;
    var caveDown = false;
    if(self.z == 0){
      var gtu = getTile(0,u[0],u[1]);
      var gtl = getTile(0,l[0],l[1]);
      var gtr = getTile(0,r[0],r[1]);
      var gtd = getTile(0,d[0],d[1]);
      if((gtu == 14 || gtu == 16 || gtu == 6) && u.toString() !== tLoc.toString()){
        doorUp = true;
      } else if((gtl == 14 || gtl == 16 || gtl == 6) && l.toString() !== tLoc.toString()){
        doorLeft = true;
      } else if((gtr == 14 || gtr == 16 || gtr == 6) && r.toString() !== tLoc.toString()){
        doorRight = true;
      } else if(gtd == 6 && d.toString() !== tLoc.toString()){
        caveDown = true;
      }
    }
    if(dir == 'dr'){
      if(isWalkable(self.z,d[0],d[1]) || doorRight){
        self.move(d);
      } else {
        if(isWalkable(self.z,r[0],r[1])){
          self.move(r);
        }
      }
    } else if(dir == 'rd'){
      if(isWalkable(self.z,r[0],r[1]) && !doorRight){
        self.move(r);
      } else {
        if(isWalkable(self.z,d[0],d[1])){
          self.move(d);
        }
      }
    } else if(dir == 'r'){
      if(isWalkable(self.z,r[0],r[1]) && !doorRight){
        self.move(r);
      } else {
        if(self.lastDir == 'ur' || self.lastDir == 'ru'){
          if(isWalkable(self.z,u[0],u[1])){
            self.move(u);
          }
        } else {
          if(isWalkable(self.z,d[0],d[1])){
            self.move(d);
          }
        }
      }
    } else if(dir == 'd'){
      if(isWalkable(self.z,d[0],d[1]) && !caveDown){
        self.move(d);
      } else {
        if(self.lastDir == 'dr' || self.lastDir == 'rd'){
          if(isWalkable(self.z,r[0],r[1])){
            self.move(r);
          } else {
            if(isWalkable(self.z,l[0],l[1])){
              self.move(l);
            }
          }
        }
      }
    } else if(dir == 'ru'){
      if(isWalkable(self.z,r[0],r[1]) || doorUp){
        self.move(r);
      } else {
        if(isWalkable(self.z,u[0],u[1])){
          self.move(u);
        }
      }
    } else if(dir == 'ur'){
      if(isWalkable(self.z,u[0],u[1]) && !doorUp){
        self.move(u);
      } else {
        if(isWalkable(self.z,r[0],r[1])){
          self.move(r);
        }
      }
    } else if(dir == 'u'){
      var u = [loc[0],loc[1]-1];
      if(isWalkable(self.z,u[0],u[1]) && !doorUp){
        self.move(u);
      } else {
        if(self.lastDir == 'ur' || self.lastDir == 'ru'){
          if(isWalkable(self.z,r[0],r[1])){
            self.move(r);
          }
        } else {
          if(isWalkable(self.z,l[0],l[1])){
            self.move(l);
          }
        }
      }
    } else if(dir == 'lu'){
      if(isWalkable(self.z,l[0],l[1]) && !doorLeft){
        self.move(l);
      } else {
        var u = [loc[0],loc[1]-1];
        if(isWalkable(self.z,u[0],u[1])){
          self.move(u);
        }
      }
    } else if(dir == 'ul'){
      var u = [loc[0],loc[1]-1];
      if(isWalkable(self.z,u[0],u[1]) && !doorUp){
        self.move(u);
      } else {
        var l = [loc[0]-1,loc[1]];
        if(isWalkable(self.z,l[0],l[1])){
          self.move(l);
        }
      }
    } else if(dir == 'ld'){
      var l = [loc[0]-1,loc[1]];
      if(isWalkable(self.z,l[0],l[1]) && !doorLeft){
        self.move(l);
      } else {
        var d = [loc[0],loc[1]+1];
        if(isWalkable(self.z,d[0],d[1])){
          self.move(d);
        }
      }
    } else if(dir == 'dl'){
      var d = [loc[0],loc[1]+1];
      if(isWalkable(self.z,d[0],d[1]) || doorLeft){
        self.move(d);
      } else {
        var l = [loc[0]-1,loc[1]];
        if(isWalkable(self.z,l[0],l[1])){
          self.move(l);
        }
      }
    } else if(dir == 'l'){
      var l = [loc[0]-1,loc[1]];
      if(isWalkable(self.z,l[0],l[1]) && !doorLeft){
        self.move(l);
      } else {
        if(self.lastDir == 'ul' || self.lastDir == 'lu'){
          var u = [loc[0],loc[1]-1];
          if(isWalkable(self.z,u[0],u[1])){
            self.move(u);
          } else {
            var d = [loc[0],loc[1]+1];
            if(isWalkable(self.z,d[0],d[1])){
              self.move(d);
            }
          }
        }
      }
    }
    var newLoc = getLoc(self.x,self.y);
    if(newLoc.toString() !== loc.toString()){
      self.prevLoc = loc;
      loc = newLoc;
    }
    var diff = {
      c:loc[0]-self.prevLoc[0],
      r:loc[1]-self.prevLoc[1]
    };
    if((diff.c > -2 && diff.c < 2) && diff.r == 0 || (diff.r > -2 && diff.r < 2) && diff.c == 0){
      self.stuck++;
    }
    if(self.stuck == 200){
      console.log(self.name + ' is stuck! Getting unstuck...');
      self.stuck = 0;
      self.getPath(tz,tc,tr);
    }
  }

  self.follow = function(target,attack=false){
    if(!self.path){
      if(self.z != target.z && self.lastTarget){
        self.moveTo(self.lastTarget);
      } else {
        var loc = getLoc(self.x,self.y);
        var tLoc = getLoc(target.x,target.y);
        var dLoc = [tLoc[0],tLoc[1]+1];
        var uLoc = [tLoc[0],tLoc[1]-1];
        var lLoc = [tLoc[0]-1,tLoc[1]];
        var rLoc = [tLoc[0]+1,tLoc[1]];

        self.lastTarget = tLoc;
        if(loc.toString() != uLoc.toString() &&
        loc.toString() != dLoc.toString() &&
        loc.toString() != rLoc.toString() &&
        loc.toString() != lLoc.toString()){
          var dir = self.calcDir(loc,tLoc);
          if(dir != self.lastDir){
            self.lastDir = dir;
          }
          if(dir == 'dr'){
            var d = [loc[0],loc[1]+1];
            if(isWalkable(self.z,d[0],d[1])){
              self.move(d);
            } else {
              var r = [loc[0]+1,loc[1]];
              if(isWalkable(self.z,r[0],r[1])){
                self.move(r);
              }
            }
          } else if(dir == 'rd'){
            var r = [loc[0]+1,loc[1]];
            if(isWalkable(self.z,r[0],r[1])){
              self.move(r);
            } else {
              var d = [loc[0],loc[1]+1];
              if(isWalkable(self.z,d[0],d[1])){
                self.move(d);
              }
            }
          } else if(dir == 'r'){
            var r = [loc[0]+1,loc[1]];
            if(isWalkable(self.z,r[0],r[1])){
              self.move(r);
            } else {
              if(self.lastDir == 'ur' || self.lastDir == 'ru'){
                var u = [loc[0],loc[1]-1];
                if(isWalkable(self.z,u[0],u[1])){
                  self.move(u);
                }
              } else {
                var d = [loc[0],loc[1]+1];
                if(isWalkable(self.z,d[0],d[1])){
                  self.move(d);
                }
              }
            }
          } else if(dir == 'd'){
            var d = [loc[0],loc[1]+1];
            if(isWalkable(self.z,d[0],d[1])){
              self.move(d);
            } else {
              if(self.lastDir == 'dr' || self.lastDir == 'rd'){
                var r = [loc[0]+1,loc[1]];
                if(isWalkable(self.z,r[0],r[1])){
                  self.move(r);
                } else {
                  var l = [loc[0]-1,loc[1]];
                  if(isWalkable(self.z,l[0],l[1])){
                    self.move(l);
                  }
                }
              }
            }
          } else if(dir == 'ru'){
            var r = [loc[0]+1,loc[1]];
            if(isWalkable(self.z,r[0],r[1])){
              self.move(r);
            } else {
              var u = [loc[0],loc[1]-1];
              if(isWalkable(self.z,u[0],u[1])){
                self.move(u);
              }
            }
          } else if(dir == 'ur'){
            var u = [loc[0],loc[1]-1];
            if(isWalkable(self.z,u[0],u[1])){
              self.move(u);
            } else {
              var r = [loc[0]+1,loc[1]];
              if(isWalkable(self.z,r[0],r[1])){
                self.move(r);
              }
            }
          } else if(dir == 'u'){
            var u = [loc[0],loc[1]-1];
            if(isWalkable(self.z,u[0],u[1])){
              self.move(u);
            } else {
              if(self.lastDir == 'ur' || self.lastDir == 'ru'){
                var r = [loc[0]+1,loc[1]];
                if(isWalkable(self.z,r[0],r[1])){
                  self.move(r);
                }
              } else {
                var l = [loc[0]-1,loc[1]];
                if(isWalkable(self.z,l[0],l[1])){
                  self.move(l);
                }
              }
            }
          } else if(dir == 'lu'){
            var l = [loc[0]-1,loc[1]];
            if(isWalkable(self.z,l[0],l[1])){
              self.move(l);
            } else {
              var u = [loc[0],loc[1]-1];
              if(isWalkable(self.z,u[0],u[1])){
                self.move(u);
              }
            }
          } else if(dir == 'ul'){
            var u = [loc[0],loc[1]-1];
            if(isWalkable(self.z,u[0],u[1])){
              self.move(u);
            } else {
              var l = [loc[0]-1,loc[1]];
              if(isWalkable(self.z,l[0],l[1])){
                self.move(l);
              }
            }
          } else if(dir == 'ld'){
            var l = [loc[0]-1,loc[1]];
            if(isWalkable(self.z,l[0],l[1])){
              self.move(l);
            } else {
              var d = [loc[0],loc[1]+1];
              if(isWalkable(self.z,d[0],d[1])){
                self.move(d);
              }
            }
          } else if(dir == 'dl'){
            var d = [loc[0],loc[1]+1];
            if(isWalkable(self.z,d[0],d[1])){
              self.move(d);
            } else {
              var l = [loc[0]-1,loc[1]];
              if(isWalkable(self.z,l[0],l[1])){
                self.move(l);
              }
            }
          } else if(dir == 'l'){
            var l = [loc[0]-1,loc[1]];
            if(isWalkable(self.z,l[0],l[1])){
              self.move(l);
            } else {
              if(self.lastDir == 'ul' || self.lastDir == 'lu'){
                var u = [loc[0],loc[1]-1];
                if(isWalkable(self.z,u[0],u[1])){
                  self.move(u);
                } else {
                  var d = [loc[0],loc[1]+1];
                  if(isWalkable(self.z,d[0],d[1])){
                    self.move(d);
                  }
                }
              }
            }
          } else if(dir == 'c'){
            var dirs = [[loc[0],loc[1]+1],[loc[0],loc[1]-1],[loc[0]+1,loc[1]],[loc[0]-1,loc[1]]];
            var select = [];
            for(var i in dirs){
              var dir = dirs[i];
              if(isWalkable(self.z,dir[0],dir[1])){
                select.push(dir);
              }
            }
            var rand = Math.floor(Math.random() * select.length);
            self.move(select[rand]);
          }
        } else {
          if(loc.toString() == uLoc.toString()){
            self.facing = 'down';
          } else if(loc.toString() == dLoc.toString()){
            self.facing = 'up';
          } else if(loc.toString() == lLoc.toString()){
            self.facing = 'right';
          } else if(loc.toString() == rLoc.toString()){
            self.facing = 'left';
          }
          if(attack && self.attackCooldown == 0){
            self.attack(self.facing);
          }
        }
      }
    }
  }

  self.update = function(){
    var loc = getLoc(self.x,self.y);
    var b = getBuilding(self.x,self.y);
    self.zoneCheck();
    if(self.stealthed){
      self.drag = 0.5;
      self.revealCheck();
    } else {
      self.drag = 1;
    }
    if(self.torchBearer){
      if(!self.hasTorch){
        if((self.z == 0 && nightfall) || self.z == -1 || self.z == -2){
          self.lightTorch(Math.random());
        }
      }
    }
    if(self.idleTime > 0){
      self.idleTime--;
    }
    if(self.attackCooldown > 0){
      self.attackCooldown--;
    }

    if(self.z == 0){
      if(getTile(0,loc[0],loc[1]) == 6){
        self.z = -1;
        self.caveEntrance = loc;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd * self.drag;
      } else if(getTile(0,loc[0],loc[1]) >= 1 && getTile(0,loc[0],loc[1]) < 2){
        self.innaWoods = true;
        self.onMtn = false;
        if(self.class != 'Deer' && self.class != 'Boar' && self.class != 'Wolf'){
          self.maxSpd = (self.baseSpd * 0.3) * self.drag;
        }
      } else if(getTile(0,loc[0],loc[1]) >= 2 && getTile(0,loc[0],loc[1]) < 4){
        self.innaWoods = false;
        self.onMtn = false;
        if(self.class != 'Deer' && self.class != 'Boar' && self.class != 'Wolf'){
          self.maxSpd = (self.baseSpd * 0.5) * self.drag;
        }
      } else if(getTile(0,loc[0],loc[1]) >= 4 && getTile(0,loc[0],loc[1]) < 5){
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.6) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6 && !self.onMtn){
        self.innaWoods = false;
        self.maxSpd = (self.baseSpd * 0.2) * self.drag;
        setTimeout(function(){
          if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6){
            self.onMtn = true;
          }
        },2000);
      } else if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6 && self.onMtn){
        self.maxSpd = (self.baseSpd * 0.5) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 18){
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 1.1) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 14 || getTile(0,loc[0],loc[1]) == 16 || getTile(0,loc[0],loc[1]) == 19){
        Building.list[b].occ++;
        self.z = 1;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 0){
        self.z = -3;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.2)  * self.drag;
      } else {
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd  * self.drag;
      }
    } else if(self.z == -1){
      if(getTile(1,loc[0],loc[1]) == 2){
        self.caveEntrance = null;
        self.z = 0;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.9)  * self.drag;
      }
    } else if(self.z == -2){
      if(getTile(8,loc[0],loc[1]) == 5){
        self.z = 1;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down';
      }
    } else if(self.z == -3){
      if(self.breath > 0){
        self.breath -= 0.25;
      } else {
        self.hp -= 0.5;
      }
      if(self.hp <= 0){
        self.die({cause:'drowned'});
      }
      if(getTile(0,loc[0],loc[1]) != 0){
        self.z = 0;
        self.path = null;
        self.pathCount = 0;
        self.breath = self.breathMax;
      }
    } else if(self.z == 1){
      if(getTile(0,loc[0],loc[1] - 1) == 14 || getTile(0,loc[0],loc[1] - 1) == 16  || getTile(0,loc[0],loc[1] - 1) == 19){
        var exit = getBuilding(self.x,self.y-tileSize);
        Building.list[exit].occ--;
        self.z = 0;
        self.path = null;
        self.pathCount = 0;
      } else if(getTile(4,loc[0],loc[1]) == 3 || getTile(4,loc[0],loc[1]) == 4 || getTile(4,loc[0],loc[1]) == 7){
        self.z = 2;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down'
      } else if(getTile(4,loc[0],loc[1]) == 5 || getTile(4,loc[0],loc[1]) == 6){
        self.z = -2;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down';
      }
    } else if(self.z == 2){
      if(getTile(4,loc[0],loc[1]) == 3 || getTile(4,loc[0],loc[1]) == 4){
        self.z = 1;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down';
      }
    }

    ////////////////
    // VANILLA AI //
    ////////////////

    // IDLE
    if(self.mode == 'idle'){
      if(!self.action){
        if(self.military){
          var min = Math.floor(House.list[self.house].military.patrol.length/3);
          var count = 0;
          for(var i in Player.list){
            var p = Player.list[i];
            if(p.house == self.house && p.mode == 'patrol'){
              count++;
            }
          }
          if(count < min){
            self.mode = 'patrol';
          }
        }
        var cHome = getCenter(self.home.loc[0],self.home.loc[1]);
        var hDist = self.getDistance({x:cHome[0],y:cHome[1]});
        if(hDist > self.wanderRange){
          if(!self.path){
            self.return();
          }
        } else if(self.idleTime == 0){
          if(!self.path){
            var col = loc[0];
            var row = loc[1];
            var select = [[col,row-1],[col-1,row],[col,row+1],[col+1,row]];
            var target = select[Math.floor(Math.random() * 4)];
            if(target[0] < mapSize && target[0] > -1 && target[1] < mapSize && target[1] > -1){
              if(isWalkable(self.z,target[0],target[1])){
                self.move(target);
                self.idleTime += Math.floor(Math.random() * self.idleRange);
              }
            }
          }
        }
      } else if(self.action == 'combat'){
        var target = Player.list[self.combat.target];
        if(!target){
          self.combat.target = null;
          self.action = null;
        } else {
          if(self.unarmed){
            self.action = 'flee';
          } else if(self.ranged){
            var tLoc = getLoc(target.x,target.y);
            var dist = self.getDistance({
              x:target.x,
              y:target.y
            })
            if(dist < self.aggroRange/2){
              self.reposition(loc,tLoc);
            } else {
              if(self.attackCooldown <= 0){
                var angle = self.getAngle(target.x,target.y);
                self.shootArrow(angle);
              }
              if(dist > self.aggroRange){
                self.follow(target);
              }
            }
          } else {
            self.follow(target,true);
          }
          var cHome = getCenter(self.home.loc[0],self.home.loc[1]);
          var hDist = self.getDistance({
            x:cHome[0],
            y:cHome[1]
          });
          var tDist = self.getDistance({
            x:target.x,
            y:target.y
          });
          if(hDist > self.wanderRange * 4 || tDist > self.aggroRange * 2){
            self.combat.target = null;
            self.action = null;
            if(target.combat.target == self.id){
              Player.list[target.id].combat.target = null;
              Player.list[target.id].action = null;
            }
            console.log(self.class + ' returning from combat');
          }
        }
      } else if(self.action == 'flee'){
        if(!self.path){
          if(self.combat.target){
            var target = Player.list[self.combat.target];
            if(target){
              var tLoc = getLoc(target.x,target.y);
              self.reposition(loc,tLoc);
            } else {
              self.combat.target = null;
              self.action = null;
            }
          } else {
            self.action = null;
          }
        }
      }
      // PATROL
    } else if(self.mode == 'patrol'){
        if(!self.action){
          if(!self.path){
            var list = House.list[self.house].patrol;
            var select = list[Math.floor(Math.random() * list.length)];
            var build = Building.list[select];
            var area = getArea(build.plot[0],build.plot[build.plot.length-1],2);
            var tiles = [];
            for(var i in area){
              if(isWalkable(0,area[i][0],area[i][1])){
                tiles.push(area[i]);
              }
            }
            var t = tiles[Math.floor(Math.random() * tiles.length)];
            self.moveTo(self.z,t[0],t[1]);
          }
        } else if(self.action == 'combat'){
          var target = Player.list[self.combat.target];
          var lCoords = getCenter(lastLoc.loc[0],lastLoc.loc[1]);
          var lDist = self.getDistance(lCoords[0],lCoords[1]);
          if(!target || (lDist > self.aggroRange*2)){
            self.combat.target = null;
            self.action = null;
          }
          if(self.ranged){
            var tLoc = getLoc(target.x,target.y);
            var dist = self.getDistance({
              x:target.x,
              y:target.y
            })
            if(self.attackCooldown > 0){
              if(dist < 256){
                self.reposition(loc,tLoc);
              }
            } else {
              if(dist > 256){
                var angle = self.getAngle(target.x,target.y);
                self.shootArrow(angle);
                self.attackCooldown += self.attackRate/self.dexterity;
              } else {
                self.reposition(loc,tLoc);
              }
            }
          } else {
            self.follow(target,true);
          }
        }
      // ESCORT
    } else if(self.mode == 'escort'){
      var target = Player.list[self.escort.target];
      var tDist = getDistance({x:target.x,y:target.y});
      if(!self.action){
        if(!self.path){
          if(tDist > self.aggroRange){
            var tLoc = getLoc(target.x,target.y);
            var c = tLoc[0];
            var r = tLoc[1];
            var select = [];
            var grid = [[c-2,r-3],[c-1,r-3],[c,r-3],[c+1,r-3],[c+2,r-3],
            [c-3,r-2],[c-2,r-2],[c-1,r-2],[c,r-2],[c+1,r-2],[c+2,r-2],[c+3,r-2],
            [c-3,r-1],[c-2,r-1],[c-1,r-1],[c+1,r-1],[c+2,r-1],[c+3,r-1],
            [c-3,r],[c-2,r],[c+2,r],[c+3,r],
            [c-3,r+1],[c-2,r+1],[c-1,r+1],[c+1,r+1],[c+2,r+1],[c+3,r+1],
            [c-3,r+2],[c-2,r+2],[c-1,r+2],[c,r+2],[c+1,r+2],[c+2,r+2],[c+3,r+2],
            [c-2,r+3],[c-1,r+3],[c,r+3],[c+1,r+3],[c+2,r+3]];
            for(var i in grid){
              var tile = grid[i];
              if(tile[0] > -1 && tile[0] < mapSize && tile[1] > -1 && tile[1] < mapSize){
                if(isWalkable(target.z,tile[0],tile[1])){
                  select.push(tile);
                }
              }
            }
            var rand = Math.floor(Math.random() * select.length);
            var dest = select[rand];
            self.moveTo(target.z,dest[0],dest[1]);
          }
        }
      } else if(self.action == 'combat'){
        var cTarget = self.combat.target;
        if(cTarget){
          if(tDist > (self.aggroRange*1.5)){
            self.action = null;
          } else {
            if(self.ranged){
              var tLoc = getLoc(target.x,target.y);
              var dist = self.getDistance({
                x:Player.list[cTarget].x,
                y:Player.list[cTarget].y
              })
              if(self.attackCooldown > 0){
                if(dist < 256){
                  self.reposition(loc,tLoc);
                }
              } else {
                if(dist > 256){
                  var angle = self.getAngle(Player.list[cTarget].x,Player.list[cTarget].y);
                  self.shootArrow(angle);
                  self.attackCooldown += self.attackRate/self.dexterity;
                } else {
                  self.reposition(loc,tLoc);
                }
              }
            } else {
              self.follow(cTarget,true);
            }
          }
        }
      }
      // SCOUT
    } else if(self.mode == 'scout'){
      if(!self.action){
        var dest = self.scout.target;
        if(loc.toString() == dest.toString()){
          if(self.scout.reached){
            self.scout.timer--;
            if(self.scout.timer == 0){
              House.list[self.house].expand(dest);
              self.action == 'flee';
            }
          } else {
            self.scout.reached = true;
          }
        }
      } else if(self.action == 'combat'){
        if(!self.scout.rally){
          self.scout.rally = loc;
          House.list[self.house].military.campaign.rally = loc;
          Banner({
            x:loc[0],
            y:loc[1],
            z:self.z,
            qty:1,
            parent:self.id
          });
        }
        self.combat.target = null;
        self.action = 'flee';
      } else if(self.action == 'flee'){
        if(!self.path){
          var ret = self.scout.return;
          if(loc.toString() == ret.toString()){
            House.list[self.house].military.scout.units.remove(units.indexOf(self.id),1);
            self.mode = 'idle';
          } else {
            self.moveTo(self.z,ret[0],ret[1]);
          }
        }
      }
      // GUARD
    } else if(self.mode == 'guard'){
      var point = self.guard.point;
      var pCoord = getCenter(point[0],point[1]);
      var pDist = self.getDistance({
        x:pCoord[0],
        y:pCoord[1]
      });
      if(!self.action){
        if(!self.path){
          if(loc != point.loc){
            self.moveTo(point.z,point.loc[0],point.loc[1]);
          }
        }
      } else if(self.action == 'combat'){
        var target = Player.list[self.combat.target];
        if(!target || pDist > (self.aggroRange*1.5)){
          self.return({z:point.z,loc:point.loc});
        }
        if(self.ranged){
          var tLoc = getLoc(target.x,target.y);
          var dist = self.getDistance({
            x:target.x,
            y:target.y
          })
          if(self.attackCooldown > 0){
            if(dist < 256){
              self.reposition(loc,tLoc);
            }
          } else {
            if(dist > 256){
              var angle = self.getAngle(target.x,target.y);
              self.shootArrow(angle);
              self.attackCooldown += self.attackRate/self.dexterity;
            } else {
              self.reposition(loc,tLoc);
            }
          }
        } else {
          self.follow(target,true);
        }
      }
      // RAID
    } else if(self.mode == 'raid'){
      var dest = self.raid.target;
      var dCoords = getCoords(dest[0],dest[1]);
      var dDist = self.getDistance(dCoords[0],dCoords[1]);
      if(!self.action){
        if(!self.path){
          if(dDist > self.aggroRange){
            var c = dest[0];
            var r = dest[1];
            var select = [];
            var grid = [[c-2,r-3],[c-1,r-3],[c,r-3],[c+1,r-3],[c+2,r-3],
            [c-3,r-2],[c-2,r-2],[c-1,r-2],[c,r-2],[c+1,r-2],[c+2,r-2],[c+3,r-2],
            [c-3,r-1],[c-2,r-1],[c-1,r-1],[c+1,r-1],[c+2,r-1],[c+3,r-1],
            [c-3,r],[c-2,r],[c+2,r],[c+3,r],
            [c-3,r+1],[c-2,r+1],[c-1,r+1],[c+1,r+1],[c+2,r+1],[c+3,r+1],
            [c-3,r+2],[c-2,r+2],[c-1,r+2],[c,r+2],[c+1,r+2],[c+2,r+2],[c+3,r+2],
            [c-2,r+3],[c-1,r+3],[c,r+3],[c+1,r+3],[c+2,r+3]];
            for(var i in grid){
              var tile = grid[i];
              if(tile[0] > -1 && tile[0] < mapSize && tile[1] > -1 && tile[1] < mapSize){
                if(isWalkable(0,tile[0],tile[1])){
                  select.push(tile);
                }
              }
            }
            var rand = Math.floor(Math.random() * select.length);
            var dest = select[rand];
            self.moveTo(0,dest[0],dest[1]);
          }
        }
      } else if(self.action == 'combat'){
        var target = Player.list[self.combat.target];
        var lCoords = getCenter(lastLoc.loc[0],lastLoc.loc[1]);
        var lDist = self.getDistance(lCoords[0],lCoords[1]);
        if(!target || (lDist > self.aggroRange*4)){
          self.combat.target = null;
          self.action = null;
        }
        if(self.ranged){
          var tLoc = getLoc(target.x,target.y);
          var dist = self.getDistance({
            x:target.x,
            y:target.y
          })
          if(self.attackCooldown > 0){
            if(dist < 256){
              self.reposition(loc,tLoc);
            }
          } else {
            if(dist > 256){
              var angle = self.getAngle(target.x,target.y);
              self.shootArrow(angle);
              self.attackCooldown += self.attackRate/self.dexterity;
            } else {
              self.reposition(loc,tLoc);
            }
          }
        } else {
          self.follow(target,true);
        }
      } else if(self.action == 'flee'){
        if(!self.path){
          if(loc.toString() == self.home.loc.toString()){
            self.mode = 'idle';
          } else {
            self.moveTo(self.home.z,self.home.loc[0],self.home.loc[1]);
          }
        }
      }
    }
    self.updatePosition();
  }

  self.getPath = function(z,c,r){
    self.pathEnd = {z:z,loc:[c,r]};
    var start = getLoc(self.x,self.y);
    var cst = getCenter(start[0],start[1]);
    var b = getBuilding(cst[0],cst[1]);
    var cd = getCenter(c,r);
    var db = getBuilding(cd[0],cd[1]);
    if(z == self.z){
      if(self.z == 0){
        if(getLocTile(0,self.x,self.y) == 0){
          var gridSb = cloneGrid(3);
          var path = finder.findPath(start[0], start[1], c, r, gridSb);
          self.path = path;
        } else {
          var gridOb = cloneGrid(0);
          var path = finder.findPath(start[0], start[1], c, r, gridOb);
          self.path = path;
        }
      } else if(self.z == -1){
        var gridUb = cloneGrid(-1);
        var path = finder.findPath(start[0], start[1], c, r, gridUb);
        self.path = path;
      } else if(self.z == -2){
        if(b == db){
          var gridB3b = cloneGrid(-2);
          var path = finder.findPath(start[0], start[1], c, r, gridB3b);
          self.path = path;
        } else {
          //var gridB3b = cloneGrid(-2);
          var stairs = Building.list[b].dstairs;
          //var path = finder.findPath(start[0], start[1], stairs[0], stairs[1], gridB1b);
          //self.path = path;
          self.moveTo(stairs);
        }
      } else if(self.z == 1){
        if(b == db){
          //var gridB1b = cloneGrid(1);
          //var path = finder.findPath(start[0], start[1], c, r, gridB1b);
          //self.path = path;
          self.moveTo([c,r]);
        } else {
          //var gridB1b = cloneGrid(1);
          var exit = Building.list[b].entrance;
          //var path = finder.findPath(start[0], start[1], exit[0], exit[1]+1, gridB1b);
          //self.path = path;
          self.moveTo([exit[0],exit[1]+1]);
        }
      } else if(self.z == 2){
        if(b == db){
          //var gridB2b = cloneGrid(2);
          //var path = finder.findPath(start[0], start[1], c, r, gridB2b);
          //self.path = path;
          self.moveTo([c,r]);
        } else {
          //var gridB2b = cloneGrid(2);
          var stairs = Building.list[b].ustairs;
          //var path = finder.findPath(start[0], start[1], stairs[0], stairs[1], gridB1b);
          //self.path = path;
          self.moveTo(stairs);
        }
      }
    } else {
      if(self.z == 0){ // outdoors
        var gridOb = cloneGrid(0);
        if(z == -1){ // to cave
          var cave = [];
          var best = null;
          var c = getCoords(c,r);
          for(i in caveEntrances){
            var e = getCoords(caveEntrances[i]);
            var d = getDistance({x:c[0],y:c[1]},{x:e[0],y:e[1]});
            if(!best || d < best){
              cave = caveEntrances[i];
              best = d;
            }
          }
          var path = finder.findPath(start[0], start[1], cave[0], cave[1], gridOb);
          self.path = path;
        } else { // to building
          var ent = Building.list[db].entrance;
          var path = finder.findPath(start[0], start[1], ent[0], ent[1], gridOb);
          self.path = path;
        }
      } else if(self.z == -1){ // cave
        var gridUb = cloneGrid(-1);
        for(i in caveEntrances){
          var e = getCoords(caveEntrances[i]);
          var d = self.getDistance({x:e[0],y:e[1]});
          if(!best || d < best){
            cave = caveEntrances[i];
            best = d;
          }
        }
        var path = finder.findPath(start[0], start[1], cave[0], cave[1]+1, gridUb);
        self.path = path;
      } else if(self.z == 1){ // indoors
        //var gridB1b = cloneGrid(1);
        if(b == db){
          if(z == 2){ // to upstairs
            var stairs = Building.list[b].ustairs;
            //var path = finder.findPath(start[0], start[1], stairs[0], stairs[1], gridB1b);
            //self.path = path;
            self.moveTo(stairs);
          } else if(z == -2){ // to cellar/dungeon
            var stairs = Building.list[b].dstairs;
            //var path = finder.findPath(start[0], start[1], stairs[0], stairs[1], gridB1b);
            //self.path = path;
            self.moveTo(stairs);
          } else { // outdoors
            var exit = Building.list[b].entrance;
            //var path = finder.findPath(start[0], start[1], exit[0], exit[1]+1, gridB1b);
            //self.path = path;
            self.moveTo([exit[0],exit[1]+1]);
          }
        } else {
          var exit = Building.list[b].entrance;
          //var path = finder.findPath(start[0], start[1], exit[0], exit[1]+1, gridB1b);
          //self.path = path;
          self.moveTo([exit[0],exit[1]+1]);
        }
      } else if(self.z == 2){ // upstairs
        //var gridB2b = cloneGrid(2);
        var stairs = Building.list[b].ustairs;
        //var path = finder.findPath(start[0], start[1], stairs[0], stairs[1], gridB2b);
        //self.path = path;
        self.moveTo(stairs);
      } else if(self.z == -2){ // cellar/dungeon
        //var gridB3b = cloneGrid(-2);
        var stairs = Building.list[b].dstairs;
        //var path = finder.findPath(start[0], start[1], stairs[0], stairs[1], gridB3b);
        //self.path = path;
        self.moveTo(stairs);
      } else if(self.z == -3){ // underwater
        self.moveTo([c,r]);
      }
    }
  }

  self.updatePosition = function(){
    if(self.path){
      if(self.pathCount < self.path.length){
        var next = self.path[self.pathCount];
        //if(self.z == 0){ // sidestep doors in path
          //var tile = getTile(0,next[0],next[1]);
          //if((tile == 14 || tile == 16) && self.path[self.path.length-1].toString() != next.toString()){
            //self.path[self.pathCount] = [next[0]+1,next[1]+1];
          //}
        //}
        var dest = getCenter(next[0],next[1]);
        var dx = dest[0];
        var dy = dest[1];
        var diffX = dx - self.x;
        var diffY = dy - self.y;

        if(diffX >= self.maxSpd){
          self.x += self.maxSpd;
          self.pressingRight = true;
          self.facing = 'right';
        } else if(diffX <= (0-self.maxSpd)){
          self.x -= self.maxSpd;
          self.pressingLeft = true;
          self.facing = 'left';
        }
        if(diffY >= self.maxSpd){
          self.y += self.maxSpd;
          self.pressingDown = true;
          self.facing = 'down';
        } else if(diffY <= (0-self.maxSpd)){
          self.y -= self.maxSpd;
          self.pressingUp = true;
          self.facing = 'up';
        }
        if((diffX < self.maxSpd && diffX > (0-self.maxSpd)) && (diffY < self.maxSpd && diffY > (0-self.maxSpd))){
          self.pressingRight = false;
          self.pressingLeft = false;
          self.pressingDown = false;
          self.pressingUp = false;
          self.pathCount++;
          self.checkAggro();
        }
      } else {
        if(self.pathEnd){
          var loc = getLoc(self.x,self.y);
          if(self.z == self.pathEnd.z && loc.toString() == self.pathEnd.loc.toString()){
            self.pathEnd = null;
          }
        }
        self.path = null;
        self.pathCount = 0;
      }
    } else {
      return;
    }
  }

  self.getInitPack = function(){
    return {
      type:self.type,
      name:self.name,
      id:self.id,
      house:self.house,
      kingdom:self.kingdom,
      x:self.x,
      y:self.y,
      z:self.z,
      class:self.class,
      rank:self.rank,
      gear:self.gear,
      friends:self.friends,
      enemies:self.enemies,
      spriteSize:self.spriteSize,
      innaWoods:self.innaWoods,
      facing:self.facing,
      stealthed:self.stealthed,
      ranged:self.ranged,
      revealed:self.revealed,
      hp:self.hp,
      hpMax:self.hpMax,
      spirit:self.spirit,
      spiritMax:self.spiritMax,
      action:self.action,
      ghost:self.ghost
    }
  }

  self.getUpdatePack = function(){
    return {
      name:self.name,
      id:self.id,
      house:self.house,
      kingdom:self.kingdom,
      x:self.x,
      y:self.y,
      z:self.z,
      class:self.class,
      rank:self.rank,
      friends:self.friends,
      enemies:self.enemies,
      spriteSize:self.spriteSize,
      innaWoods:self.innaWoods,
      facing:self.facing,
      stealthed:self.stealthed,
      ranged:self.ranged,
      revealed:self.revealed,
      pressingUp:self.pressingUp,
      pressingDown:self.pressingDown,
      pressingLeft:self.pressingLeft,
      pressingRight:self.pressingRight,
      pressingAttack:self.pressingAttack,
      working:self.working,
      chopping:self.chopping,
      mining:self.mining,
      farming:self.farming,
      building:self.building,
      fishing:self.fishing,
      hp:self.hp,
      hpMax:self.hpMax,
      spirit:self.spirit,
      spiritMax:self.spiritMax,
      action:self.action,
      ghost:self.ghost
    }
  }

  Player.list[self.id] = self;

  initPack.player.push(self.getInitPack());
  return self;
}

// FAUNA

Sheep = function(param){
  var self = Character(param);
  self.class = 'Sheep';
}

Deer = function(param){
  var self = Character(param);
  self.class = 'Deer';
  self.aggroRange = 384;
  self.stealthCheck = function(p){
    if(p.stealthed){
      var dist = self.getDistance({x:p.x,y:p.y});
      if(dist <= 256){
        Player.list[p.id].revealed = true;
      }
    }
  }
  self.checkAggro = function(){
    for(var i in self.zGrid){
      var zc = self.zGrid[i][0];
      var zr = self.zGrid[i][1];
      if(zc < 64 && zc > -1 && zr < 64 && zr > -1){
        for(var n in zones[zr][zc]){
          var p = Player.list[zones[zr][zc][n]];
          if(p && p.z == self.z){
            var pDist = self.getDistance({
              x:p.x,
              y:p.y
            });
            if(pDist <= self.aggroRange && p.class != 'Deer'){
              self.stealthCheck(p);
              if(!Player.list[p.id].stealthed || Player.list[p.id].revealed){ // is not stealthed or is revealed
                self.combat.target = p.id;
                self.action = 'flee';
              }
            }
          }
        }
      }
    }
  }

  setInterval(function(){
    self.checkAggro();
  },1000);

  self.return = function(){
    if(!self.path){
      if(self.innaWoods){
        self.action = null;
      } else {
        self.moveTo(self.home.z,self.home.loc[0],self.home.loc[1]);
      }
    }
  }

  self.update = function(){
    var loc = getLoc(self.x,self.y);
    self.zoneCheck();
    if(self.idleTime > 0){
      self.idleTime--;
    }

    if(getTile(0,loc[0],loc[1]) >= 1 && getTile(0,loc[0],loc[1]) < 2){
      self.innaWoods = true;
      self.onMtn = false;
    } else if(getTile(0,loc[0],loc[1]) >= 2 && getTile(0,loc[0],loc[1]) < 4){
      self.innaWoods = false;
      self.onMtn = false;
    } else if(getTile(0,loc[0],loc[1]) >= 4 && getTile(0,loc[0],loc[1]) < 5){
      self.innaWoods = false;
      self.onMtn = false;
    } else if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6 && !self.onMtn){
      self.innaWoods = false;
      self.maxSpd = self.baseSpd * 0.2;
      setTimeout(function(){
        if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6){
          self.onMtn = true;
        }
      },2000);
    } else if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6 && self.onMtn){
      self.maxSpd = self.baseSpd;
    } else if(getTile(0,loc[0],loc[1]) == 18){
      self.innaWoods = false;
      self.onMtn = false;
      self.maxSpd = self.baseSpd * 1.1;
    } else if(getTile(0,loc[0],loc[1]) == 0){
      self.z = -3;
      self.innaWoods = false;
      self.onMtn = false;
      self.maxSpd = self.baseSpd * 0.1;
    } else {
      self.innaWoods = false;
      self.onMtn = false;
      self.maxSpd = self.baseSpd;
    }

    if(self.mode == 'idle'){
      if(!self.action){
        self.baseSpd = 4;
        if(!self.innaWoods){
          if(!self.path){
            self.return();
          }
        } else if(self.idleTime == 0){
          if(!self.path){
            var col = loc[0];
            var row = loc[1];
            var select = [[col,row-1],[col-1,row],[col,row+1],[col+1,row]];
            var target = select[Math.floor(Math.random() * 4)];
            if(target[0] < mapSize && target[0] > -1 && target[1] < mapSize && target[1] > -1){
              if(isWalkable(self.z,target[0],target[1])){
                self.move(target);
                self.idleTime += Math.floor(Math.random() * self.idleRange);
              }
            }
          }
        }
      } else if(self.action == 'combat'){
        self.action = 'flee';
      } else if(self.action == 'flee'){
          if(self.combat.target){
            var target = Player.list[self.combat.target];
            if(target){
              if(!self.path){
                self.baseSpd = 6.5;
                var tLoc = getLoc(target.x,target.y);
                self.reposition(loc,tLoc);
              }
            } else {
              self.combat.target = null;
              self.action = null;
            }
          } else {
            self.action = null;
          }
      }
    }
    self.updatePosition();
  }
}

Boar = function(param){
  var self = Character(param);
  self.class = 'Boar';
  self.baseSpd = 5;
  self.damage = 12;
  self.aggroRange = 128;
}

Wolf = function(param){
  var self = Character(param);
  self.class = 'Wolf';
  self.baseSpd = 5;
  self.damage = 10;
  self.wanderRange = 1024;
  self.nightmode = true;
  self.stealthCheck = function(p){
    if(p.stealthed){
      var dist = self.getDistance({x:p.x,y:p.y});
      if(dist <= 256){
        Player.list[p.id].revealed = true;
      }
    }
  }
  self.checkAggro = function(){
    for(var i in self.zGrid){
      var zc = self.zGrid[i][0];
      var zr = self.zGrid[i][1];
      if(zc < 64 && zc > -1 && zr < 64 && zr > -1){
        for(var n in zones[zr][zc]){
          var p = Player.list[zones[zr][zc][n]];
          if(p && p.z == self.z){
            var pDist = self.getDistance({
              x:p.x,
              y:p.y
            });
            if(pDist <= self.aggroRange){ // in aggro range
              if(p.class != 'Wolf'){
                self.stealthCheck(p);
                if(!Player.list[p.id].stealthed || Player.list[p.id].revealed){ // is not stealthed or is revealed
                  self.combat.target = p.id;
                  if(self.hp < (self.hpMax * 0.1)){
                    self.action = 'flee';
                  } else {
                    self.action = 'combat';
                  }
                  if(p.type == 'npc' && pDist <= p.aggroRange && p.action != 'combat'){
                    Player.list[p.id].combat.target = self.id;
                    Player.list[p.id].action = 'combat';
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  setInterval(function(){
    self.checkAggro();
  },1000);

  self.update = function(){
    var loc = getLoc(self.x,self.y);
    self.zoneCheck();
    if(nightfall){
      self.nightmode = true;
      self.aggroRange = 512;
      self.idleRange = 300;
    } else {
      self.nightmode = false;
      self.aggroRange = 256;
      self.idleRange = 1000;
    }
    if(self.idleTime > 0){
      self.idleTime--;
    }
    if(self.z == 0){
      if(getTile(0,loc[0],loc[1]) >= 1 && getTile(0,loc[0],loc[1]) < 2){
        self.innaWoods = true;
        self.onMtn = false;
      } else if(getTile(0,loc[0],loc[1]) >= 2 && getTile(0,loc[0],loc[1]) < 4){
        self.innaWoods = false;
        self.onMtn = false;
      } else if(getTile(0,loc[0],loc[1]) >= 4 && getTile(0,loc[0],loc[1]) < 5){
        self.innaWoods = false;
        self.onMtn = false;
      } else if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6 && !self.onMtn){
        self.innaWoods = false;
        self.maxSpd = (self.baseSpd * 0.2) * self.drag;
        setTimeout(function(){
          if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6){
            self.onMtn = true;
          }
        },2000);
      } else if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6 && self.onMtn){
        self.maxSpd = self.baseSpd * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 6){
        self.caveEntrance = loc;
        self.z = -1;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 18){
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 0){
        self.z = -3;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.1) * self.drag;
      } else {
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd * self.drag;
      }
    } else if(self.z == -1){
      if(getTile(1,loc[0],loc[1]) == 2){
        self.caveEntrance = null;
        self.z = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.9)  * self.drag;
      }
    }

    if(!self.action){
      self.baseSpd = 5;
      if(!self.nightmode && self.z == 0){
        var t = getTile(0,loc[0],loc[1]);
        if(t >= 2 && !self.path){
          self.return();
        } else {
          if(self.idleTime == 0){
            if(!self.path){
              var col = loc[0];
              var row = loc[1];
              var select = [[col,row-1],[col-1,row],[col,row+1],[col+1,row]];
              var target = select[Math.floor(Math.random() * 4)];
              if(target[0] < mapSize && target[0] > -1 && target[1] < mapSize && target[1] > -1){
                if(isWalkable(self.z,target[0],target[1])){
                  self.move(target);
                  self.idleTime += Math.floor(Math.random() * self.idleRange);
                }
              }
            }
          }
        }
      } else {
        if(self.idleTime == 0){
          if(!self.path){
            var col = loc[0];
            var row = loc[1];
            var select = [[col,row-1],[col-1,row],[col,row+1],[col+1,row]];
            var target = select[Math.floor(Math.random() * 4)];
            if(target[0] < mapSize && target[0] > -1 && target[1] < mapSize && target[1] > -1){
              if(isWalkable(self.z,target[0],target[1])){
                self.move(target);
                self.idleTime += Math.floor(Math.random() * self.idleRange);
              }
            }
          }
        }
      }
    } else if(self.action == 'combat'){
      if(self.nightmode){
        self.baseSpd = 7;
      } else {
        self.baseSpd = 6;
      }
      var target = Player.list[self.combat.target];
      if(target){
        if(target.hasTorch || getTile(target.z == 1)){
          self.combat.target = null;
          self.action = null;
          if(target.combat.target == self.id){
            Player.list[target.id].combat.target = null;
            Player.list[target.id].action = null;
          }
        } else {
          self.follow(target,true);
          var tDist = self.getDistance({
            x:target.x,
            y:target.y
          });
          if(tDist > self.aggroRange * 1.5){
            self.combat.target = null;
            self.action = null;
            self.baseSpd = 5;
            if(target.combat.target == self.id){
              Player.list[target.id].combat.target = null;
              Player.list[target.id].action = null;
            }
          }
        }
      } else {
        self.combat.target = null;
        self.action = null;
      }
    } else if(self.action == 'flee'){
      if(!self.path){
        if(self.combat.target){
          var target = Player.list[self.combat.target];
          if(target){
            self.baseSpd = 6;
            var tLoc = getLoc(target.x,target.y);
            self.reposition(loc,tLoc);
          } else {
            self.combat.target = null;
            self.action = null;
          }
        } else {
          self.action = null;
        }
      }
    }
    self.updatePosition();
  }
}

Falcon = function(param){
  var self = Character(param);
  self.class = 'Falcon';
  self.falconry = param.falconry;
  self.hp = null;
  self.baseSpd = 3;
  self.maxSpd = 3;
  self.spriteSize = tileSize*7;
  self.update = function(){
    if(!self.path){
      if(!self.falconry){
        self.path = randomSpawnO();
      }
    } else {
      var dx = self.path[0];
      var dy = self.path[1];
      var diffX = dx - self.x;
      var diffY = dy - self.y;

      if(diffX >= self.maxSpd && diffY >= self.maxSpd){
        self.x += self.maxSpd;
        self.y += self.maxSpd;
        if(diffX > diffY){
          self.pressingRight = true;
          self.pressingLeft = false;
          self.pressingDown = false;
          self.pressingUp = false;
          self.facing = 'right';
        } else {
          self.pressingRight = false;
          self.pressingLeft = false;
          self.pressingDown = true;
          self.pressingUp = false;
          self.facing = 'down';
        }
      } else if(diffX >= self.maxSpd && diffY <= (0-self.maxSpd)){
        self.x += self.maxSpd;
        self.y -= self.maxSpd;
        if(diffX > diffY*(-1)){
          self.pressingRight = true;
          self.pressingLeft = false;
          self.pressingDown = false;
          self.pressingUp = false;
          self.facing = 'right';
        } else {
          self.pressingRight = false;
          self.pressingLeft = false;
          self.pressingDown = false;
          self.pressingUp = true;
          self.facing = 'up';
        }
      } else if(diffX <= (0-self.maxSpd) && diffY >= self.maxSpd){
        self.x -= self.maxSpd;
        self.y += self.maxSpd;
        if(diffX*(-1) > diffY){
          self.pressingRight = false;
          self.pressingLeft = true;
          self.pressingDown = false;
          self.pressingUp = false;
          self.facing = 'left';
        } else {
          self.pressingRight = false;
          self.pressingLeft = false;
          self.pressingDown = true;
          self.pressingUp = false;
          self.facing = 'down';
        }
      } else if(diffX <= (0-self.maxSpd) && diffY <= (0-self.maxSpd)){
        self.x -= self.maxSpd;
        self.y -= self.maxSpd;
        if(diffX < diffY){
          self.pressingRight = false;
          self.pressingLeft = true;
          self.pressingDown = false;
          self.pressingUp = false;
          self.facing = 'left';
        } else {
          self.pressingRight = false;
          self.pressingLeft = false;
          self.pressingDown = false;
          self.pressingUp = true;
          self.facing = 'up';
        }
      } else if(diffX >= self.maxSpd){
        self.x += self.maxSpd;
        self.pressingRight = true;
        self.pressingLeft = false;
        self.pressingDown = false;
        self.pressingUp = false;
        self.facing = 'right';
      } else if(diffX <= (0-self.maxSpd)){
        self.x -= self.maxSpd;
        self.pressingRight = false;
        self.pressingLeft = true;
        self.pressingDown = false;
        self.pressingUp = false;
        self.facing = 'left';
      } else if(diffY >= self.maxSpd){
        self.y += self.maxSpd;
        self.pressingRight = false;
        self.pressingLeft = false;
        self.pressingDown = true;
        self.pressingUp = false;
        self.facing = 'down';
      } else if(diffY <= (0-self.maxSpd)){
        self.y -= self.maxSpd;
        self.pressingRight = false;
        self.pressingLeft = false;
        self.pressingDown = false;
        self.pressingUp = true;
        self.facing = 'up';
      } else {
        if(!self.falconry){
          self.path = randomSpawnO();
        }
      }
    }
  }
}

// UNITS

SerfM = function(param){
  var self = Character(param);
  self.name = param.name;
  self.class = 'SerfM';
  self.sex = 'm';
  self.spriteSize = tileSize*1.5;
  self.unarmed = true;
  self.tether = null; // {z,loc}
  self.tavern = param.tavern;
  self.hut = param.hut;
  self.work = {hq:null,spot:null}; // {hq,spot}
  self.dayTimer = false;
  self.workTimer = false;

  self.update = function(){
    var loc = getLoc(self.x,self.y);
    self.zoneCheck();

    if(self.z == 0){
      if(getTile(0,loc[0],loc[1]) == 6){
        self.caveEntrance = loc;
        self.z = -1;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd * self.drag;
      } else if(getTile(0,loc[0],loc[1]) >= 1 && getTile(0,loc[0],loc[1]) < 2){
        self.innaWoods = true;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.3) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) >= 2 && getTile(0,loc[0],loc[1]) < 4){
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.5) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) >= 4 && getTile(0,loc[0],loc[1]) < 5){
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.6) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6 && !self.onMtn){
        self.innaWoods = false;
        self.maxSpd = (self.baseSpd * 0.2) * self.drag;
        setTimeout(function(){
          if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6){
            self.onMtn = true;
          }
        },2000);
      } else if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6 && self.onMtn){
        self.maxSpd = (self.baseSpd * 0.5) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 18){
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 1.1) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 14 || getTile(0,loc[0],loc[1]) == 16 || getTile(0,loc[0],loc[1]) == 19){
        var b = getBuilding(self.x,self.y);
        Building.list[b].occ++;
        self.z = 1;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 0){
        self.z = -3;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.2)  * self.drag;
      } else {
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd  * self.drag;
      }
    } else if(self.z == -1){
      if(getTile(1,loc[0],loc[1]) == 2){
        self.caveEntrance = null;
        self.z = 0;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.9)  * self.drag;
      }
    } else if(self.z == -2){
      if(getTile(8,loc[0],loc[1]) == 5){
        self.z = 1;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down';
      }
    } else if(self.z == -3){
      if(self.breath > 0){
        self.breath -= 0.25;
      } else {
        self.hp -= 0.5;
      }
      if(self.hp <= 0){
        self.die({cause:'drowned'});
      }
      if(getTile(0,loc[0],loc[1]) != 0){
        self.z = 0;
        self.path = null;
        self.pathCount = 0;
        self.breath = self.breathMax;
      }
    } else if(self.z == 1){
      if(getTile(0,loc[0],loc[1] - 1) == 14 || getTile(0,loc[0],loc[1] - 1) == 16  || getTile(0,loc[0],loc[1] - 1) == 19){
        var exit = getBuilding(self.x,self.y-tileSize);
        Building.list[exit].occ--;
        self.z = 0;
        self.path = null;
        self.pathCount = 0;
      } else if(getTile(4,loc[0],loc[1]) == 3 || getTile(4,loc[0],loc[1]) == 4 || getTile(4,loc[0],loc[1]) == 7){
        self.z = 2;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down'
      } else if(getTile(4,loc[0],loc[1]) == 5 || getTile(4,loc[0],loc[1]) == 6){
        self.z = -2;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down';
      }
    } else if(self.z == 2){
      if(getTile(4,loc[0],loc[1]) == 3 || getTile(4,loc[0],loc[1]) == 4){
        self.z = 1;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down';
      }
    }

    if(tempus == 'VI.a' && self.mode != 'work' && !self.dayTimer){
      self.dayTimer = true;
      var rand = Math.floor(Math.random() * (3600000/(period*6)));
      setTimeout(function(){
        self.mode = 'work';
        self.action = null;
        self.dayTimer = false;
        console.log(self.name + ' heads to work');
      },rand);
    } else if(tempus == 'VI.p' && self.action == 'task' && !self.dayTimer){
      self.dayTimer = true;
      var rand = Math.floor(Math.random() * (3600000/(period*6)));
      setTimeout(function(){
        self.action = 'clockout';
        self.work.spot = null;
        self.dayTimer = false;
        console.log(self.name + ' is clocking out');
      },rand);
    } else if(tempus == 'XI.p' && self.action == 'tavern' && !self.dayTimer){
      self.dayTimer = true;
      var rand = Math.floor(Math.random() * (3600000/(period/2)));
      setTimeout(function(){
        self.tether = null;
        self.action = null;
        self.dayTimer = false;
        console.log(self.name + ' heads home for the night');
      },rand);
    }

    if(self.idleTime > 0){
      self.idleTime--;
    }

    // WORK
    if(self.mode == 'work'){
      var hq = Building.list[self.work.hq];
      if(!self.action){
        if(Building.list[self.hut].built){ // if hut is built
          if(self.house){
            for(var i in Building.list){
              var b = Building.list[i];
              if(b.house == self.house && !b.built){ // check for any build projects
                var dist = getDistance({x:self.x,y:self.y},{x:b.x,y:b.y});
                if(dist <= 1280){
                  var select = [];
                  for(var i in b.plot){
                    var p = b.plot[i];
                    var t = getTile(0,p[0],p[1]);
                    if(t == 11 || t == 11.5){
                      select.push(p);
                    }
                    self.work.spot = select[Math.floor(Math.random() * select.length)];
                    self.action = 'build';
                    return;
                  }
                }
              }
            }
          }
          var tDist = 0;
          var avgDist = null;
          for(var i in hq.resources){
            var res = hq.resources[i];
            var r = getCenter(res[0],res[1]);
            var dist = getDistance({x:hq.x,y:hq.y},{x:r[0],y:r[1]});
            tDist += dist;
          }
          avgDist = tDist/hq.resources.length;
          var select = [];
          for(var i in hq.resources){
            var res = hq.resources[i];
            var r = getCenter(res[0],res[1]);
            var dist = getDistance({x:hq.x,y:hq.y},{x:r[0],y:r[1]});
            if(dist <= avgDist){
              select.push(res);
            }
          }
          console.log(hq.type + ' res: ' + select.length);
          self.work.spot = select[Math.floor(Math.random() * select.length)];
          Building.list[self.work.hq].log[self.id] = self.work.spot;
          self.action = 'task';
          if(self.work.spot){
            console.log(self.name + ' working @ ' + hq.type);
          } else {
            console.log(self.name + ' failed to find work spot @ ' + hq.type);
          }
        } else {
          var hut = Building.list[self.hut];
          var select = [];
          for(var i in hut.plot){
            var p = hut.plot[i];
            var t = getTile(0,p[0],p[1]);
            if(t == 11){
              select.push(p);
            }
          }
          self.work.spot = select[Math.floor(Math.random() * select.length)];
          self.action = 'build';
        }
      } else if(self.action == 'build'){
        var spot = self.work.spot;
        if(spot){
          var cs = getCenter(spot[0],spot[1]);
          var build = getBuilding(cs[0],cs[1]);
          if(Building.list[build].built){
            self.work.spot = null;
            self.action = null;
          } else {
            if(loc.toString() == spot.toString()){
                var gt = getTile(0,spot[0],spot[1]);
                if(gt == 11){
                  if(!self.building){
                    Build(self.id);
                  }
                } else {
                  var plot = Building.list[build].plot;
                  var select = [];
                  for(var i in plot){
                    var p = plot[i];
                    var t = getTile(0,p[0],p[1]);
                    if(t == 11){
                      select.push(p);
                    }
                  }
                  self.work.spot = select[Math.floor(Math.random() * select.length)];
                }
            } else {
              if(!self.path){
                self.moveTo(0,spot[0],spot[1]);
              }
            }
          }
        } else {
          self.action = null;
        }
      } else if(self.action == 'task'){
        var spot = self.work.spot;
        if(!spot){
          self.action = null;
        } else {
          if(hq.type == 'mill'){
            if(self.inventory.grain >= 10){
              var b = Building.list[self.work.hq];
              var dropoff = [b.plot[0][0],b.plot[0][1]+1];
              if(loc.toString() == dropoff.toString()){
                self.facing = 'up';
                self.inventory.grain -= 9;
                if(House.list[b.owner]){
                  House.list[b.owner].stores.grain += 6;
                  console.log(House.list[b.owner].name + ' +6 Grain');
                } else if(Player.list[b.owner].house){
                  var h = Player.list[b.owner].house;
                  House.list[h].stores.grain += 6;
                  console.log(House.list[h].name + ' +6 Grain');
                } else {
                  Player.list[b.owner].stores.grain += 6
                  console.log(Player.list[b.owner].name + ' +6 Grain');
                }
                self.inventory.flour += 3;
              } else {
                if(!self.path){
                  self.moveTo(0,dropoff[0],dropoff[1]);
                }
              }
            } else {
              if(loc.toString() == spot.toString()){
                var tile = getTile(0,spot[0],spot[1]);
                self.working = true;
                self.farming = true;
                if(!self.workTimer){
                  self.workTimer = true;
                  setTimeout(function(){
                    if(self.farming){
                      var b = getBuilding(self.x,self.y);
                      var f = Building.list[b];
                      if(tile == 8){
                        tileChange(6,spot[0],spot[1],1,true);
                        var count = 0;
                        var next = [];
                        for(var i in f.plot){
                          var p = f.plot[i];
                          if(getTile(6,p[0],p[1]) >= 25){
                            count++;
                          } else {
                            next.push(p);
                          }
                        }
                        if(count == 9){
                          for(var i in f.plot){
                            var p = f.plot[i];
                            tileChange(0,p[0],p[1],9);
                          }
                          mapEdit();
                        } else {
                          var res = getTile(6,spot[0],spot[1]);
                          if(res >= 25){
                            for(var n in hq.resources){
                              var r = hq.resources[n];
                              if(r.toString() == spot.toString()){
                                Building.list[self.work.hq].resources.splice(n,1);
                              }
                            }
                          }
                          var rand = Math.floor(Math.random() * next.length);
                          self.work.spot = next[rand];
                          Building.list[self.work.hq].log[self.id] = self.work.spot;
                        }
                      } else if(tile == 9){
                        tileChange(6,spot[0],spot[1],1,true);
                        var count = 0;
                        var next = [];
                        for(var i in f.plot){
                          var p = f.plot[i];
                          if(getTile(6,p[0],p[1]) >= 50){
                            count++;
                          }
                        }
                        if(count == 9){
                          for(var i in f.plot){
                            var p = f.plot[i];
                            tileChange(0,p[0],p[1],10);
                          }
                          mapEdit();
                        } else {
                          var res = getTile(6,spot[0],spot[1]);
                          if(res >= 25){
                            for(var n in hq.resources){
                              var r = hq.resources[n];
                              if(r.toString() == spot.toString()){
                                Building.list[self.work.hq].resources.splice(n,1);
                              }
                            }
                          }
                          var rand = Math.floor(Math.random() * next.length);
                          self.work.spot = next[rand];
                          Building.list[self.work.hq].log[self.id] = self.work.spot;
                        }
                      } else {
                        tileChange(6,spot[0],spot[1],-1,true);
                        if(getTile(6,spot[0],spot[1]) == 0){
                          tileChange(0,spot[0],spot[1],8);
                          var count = 0;
                          var next = [];
                          for(var i in f.plot){
                            var p = f.plot[i]
                            var t = getTile(0,p[0],p[1]);
                            if(t == 8){
                              count++;
                            } else {
                              next.push(p);
                            }
                          }
                          if(count == 9){
                            for(var n in f.plot){
                              var p = f.plot[n];
                              if(p.toString() == spot.toString()){
                                continue;
                              } else {
                                Building.list[self.work.hq].resources.push(p);
                              }
                            }
                          } else {
                            for(var n in hq.resources){
                              var r = hq.resources[n];
                              if(r.toString() == spot.toString()){
                                Building.list[self.work.hq].resources.splice(n,1);
                              }
                            }
                            var rand = Math.floor(Math.random() * next.length);
                            self.work.spot = next[rand];
                            Building.list[self.work.hq].log[self.id] = self.work.spot;
                          }
                        }
                        mapEdit();
                      }
                    }
                    self.workTimer = false;
                    self.working = false;
                    self.farming = false;
                  },10000/self.strength);
                }
              } else {
                if(!self.path){
                  self.moveTo(0,spot[0],spot[1]);
                }
              }
            }
          } else if(hq.type == 'lumbermill'){
            var gt = getTile(0,spot[0],spot[1]);
            if(gt >= 3){
              self.work.spot = null;
              for(var i in hq.resources){
                var f = hq.resources[i];
                if(f.toString() == spot.toString()){
                  Building.list[self.work.hq].resources.splice(i,1);
                }
              }
              return;
            }
            if(self.inventory.wood >= 10){
              var b = Building.list[self.work.hq];
              var dropoff = [b.plot[0][0],b.plot[0][1]+1];
              if(loc.toString() == dropoff.toString()){
                self.facing = 'up';
                self.inventory.wood -= 8;
                if(House.list[b.owner]){
                  House.list[b.owner].stores.wood += 8;
                  console.log(House.list[b.owner].name + ' +8 Wood');
                } else if(Player.list[b.owner].house){
                  var h = Player.list[b.owner].house;
                  House.list[h].stores.wood += 8;
                  console.log(House.list[h].name + ' +8 Wood');
                } else {
                  Player.list[b.owner].stores.wood += 8
                  console.log(Player.list[b.owner].name + ' +8 Wood');
                }
              } else {
                if(!self.path){
                  self.moveTo(0,dropoff[0],dropoff[1]);
                }
              }
            } else {
              if(loc.toString() == spot.toString()){
                var tile = getTile(0,spot[0],spot[1]);
                self.working = true;
                self.chopping = true;
                if(!self.workTimer){
                  self.workTimer = true;
                  setTimeout(function(){
                    if(self.chopping){
                      tileChange(6,spot[0],spot[1],-1,true);
                      self.inventory.wood += 10; // ALPHA
                      console.log(self.name + ' chopped 10 Wood');
                      var res = getTile(6,spot[0],spot[1]);
                      if(res <= 0 ){
                        tileChange(0,spot[0],spot[1],1,true);
                        mapEdit();
                        for(var i in hq.resources){
                          var f = hq.resources[i];
                          if(f.toString() == spot.toString()){
                            Building.list[self.work.hq].resources.splice(i,1);
                          }
                        }
                        self.action = null;
                      } else if(res < 101){
                        var gt = getTile(0,spot[0],spot[1]);
                        if(gt >= 1 && gt < 2){
                          tileChange(0,spot[0],spot[1],1,true);
                          mapEdit();
                        }
                      }
                    }
                    self.workTimer = false;
                    self.working = false;
                    self.chopping = false;
                  },10000/self.strength);
                }
              } else {
                if(!self.path){
                  self.moveTo(0,spot[0],spot[1]);
                }
              }
            }
          } else if(hq.type == 'mine'){
            if(hq.cave){ // metal
              if(self.inventory.ironeore >= 10){
                var b = Building.list[self.work.hq];
                var drop = [b.plot[0][0],b.plot[0][1]+1];
                if(loc.toString() == drop.toString()){
                  self.facing = 'up';
                  self.inventory.ironore -= 9;
                  if(House.list[b.owner]){
                    House.list[b.owner].stores.ironore += 9;
                    console.log(House.list[b.owner].name + ' +9 Iron Ore');
                  } else if(Player.list[b.owner].house){
                    var h = Player.list[b.owner].house;
                    House.list[h].stores.ironore += 9;
                    console.log(House.list[h].name + ' +9 Iron Ore');
                  } else {
                    Player.list[b.owner].stores.ironore += 9;
                    console.log(Player.list[b.owner].name + ' +9 Iron Ore');
                  }
                } else {
                  if(!self.path){
                    self.moveTo(0,drop[0],drop[1]);
                  }
                }
              } else if(self.inventory.silverore >= 1){
                var b = Building.list[self.work.hq];
                var drop = [b.plot[0][0],b.plot[0][1]+1];
                if(loc.toString() == drop.toString()){
                  self.facing = 'up';
                  self.inventory.silverore--;
                  if(House.list[b.owner]){
                    House.list[b.owner].stores.silverore++;
                    console.log(House.list[b.owner].name + ' +1 Silver Ore');
                  } else if(Player.list[b.owner].house){
                    var h = Player.list[b.owner].house;
                    House.list[h].stores.silverore++;
                    console.log(House.list[h].name + ' +1 Silver Ore');
                  } else {
                    Player.list[b.owner].stores.silverore++;
                    console.log(Player.list[b.owner].name + ' +1 Silver Ore');
                  }
                } else {
                  if(!self.path){
                    self.moveTo(0,drop[0],drop[1]);
                  }
                }
              } else if(self.inventory.goldore >= 1){
                var b = Building.list[self.work.hq];
                var drop = [b.plot[0][0],b.plot[0][1]+1];
                if(loc.toString() == drop.toString()){
                  self.facing = 'up';
                  self.inventory.goldore--;
                  if(House.list[b.owner]){
                    House.list[b.owner].stores.goldore++;
                    console.log(House.list[b.owner].name + ' +1 Gold Ore');
                  } else if(Player.list[b.owner].house){
                    var h = Player.list[b.owner].house;
                    House.list[h].stores.goldore++;
                    console.log(House.list[h].name + ' +1 Gold Ore');
                  } else {
                    Player.list[b.owner].stores.goldore++;
                    console.log(Player.list[b.owner].name + ' +1 Gold Ore');
                  }
                } else {
                  if(!self.path){
                    self.moveTo(0,drop[0],drop[1]);
                  }
                }
              } else if(self.inventory.diamond >= 1){
                var b = Building.list[self.work.hq];
                var drop = [b.plot[0][0],b.plot[0][1]+1];
                if(loc.toString() == drop.toString()){
                  self.facing = 'up';
                  self.inventory.diamond--;
                  if(House.list[b.owner]){
                    House.list[b.owner].stores.diamond++;
                    console.log(House.list[b.owner].name + ' +1 Diamond');
                  } else if(Player.list[b.owner].house){
                    var h = Player.list[b.owner].house;
                    House.list[h].stores.diamond++;
                    console.log(House.list[h].name + ' +1 Diamond');
                  } else {
                    Player.list[b.owner].stores.diamond++;
                    console.log(Player.list[b.owner].name + ' +1 Diamond');
                  }
                } else {
                  if(!self.path){
                    self.moveTo(0,drop[0],drop[1]);
                  }
                }
              } else {
                if(loc.toString() == spot.toString() && self.z == -1){
                  var tile = getTile(0,spot[0],spot[1]);
                  self.working = true;
                  self.mining = true;
                  if(!self.workTimer){
                    self.workTimer = true;
                    setTimeout(function(){
                      if(self.mining){
                        var roll = Math.random();
                        if(roll < 0.001){
                          self.inventory.diamond++;
                          console.log(self.name + ' mined 1 Diamond');
                        } else if(roll < 0.01){
                          self.inventory.goldore++;
                          console.log(self.name + ' mined 1 Gold Ore');
                        } else if(roll < 0.1){
                          self.inventory.silverore++;
                          console.log(self.name + ' mined 1 Silver Ore');
                        } else if(roll < 0.5){
                          self.inventory.ironore++;
                          console.log(self.name + ' mined 1 Iron Ore');
                        }
                        tileChange(7,spot[0],spot[1],-1,true);
                        var res = getTile(7,spot[0],spot[1]);
                        if(res <= 0){
                          tileChange(0,spot[0],spot[1],7);
                          mapEdit();
                          for(var i in hq.resources){
                            var f = hq.resources[i];
                            if(f.toString() == spot.toString()){
                              Building.list[self.work.hq].resources.splice(i,1);
                            }
                          }
                          var adj = [[spot[0]-1,spot[1]],[spot[0],spot[1]-1],[spot[0]+1,spot[1]],[spot[0],spot[1]+1]];
                          var n = [];
                          for(var i in adj){
                            var t = adj[i];
                            var gt = getTile(1,t[0],t[1]);
                            if(gt == 1){
                              n.push(t);
                            }
                          }
                          if(n.length > 0){
                            for(var i in n){
                              var r = n[i];
                              var num = 3 + Number((Math.random()*0.9).toFixed(2));
                              tileChange(1,r[0],r[1],num);
                              matrixChange(1,r[0],r[1],0);
                              Building.list[self.work.hq].resources.push(r);
                            }
                            mapEdit();
                          }
                          self.action = null;
                        }
                      }
                      self.workTimer = false;
                      self.working = false;
                      self.mining = false;
                    },10000/self.strength);
                  }
                }
              }
            } else { // stone
              var gt = getTile(0,spot[0],spot[1]);
              if(gt < 4 || gt > 6){
                self.work.spot = null;
                for(var i in hq.resources){
                  var f = hq.resources[i];
                  if(f.toString() == spot.toString()){
                    Building.list[self.work.hq].resources.splice(i,1);
                  }
                }
                return;
              }
              if(self.inventory.stone >= 10){
                var b = Building.list[self.work.hq];
                var drop = [b.plot[0][0],b.plot[0][1]+1];
                if(loc.toString() == drop.toString()){
                  self.facing = 'up';
                  self.inventory.stone -= 8;
                  if(House.list[b.owner]){
                    House.list[b.owner].stores.stone += 8;
                    console.log(House.list[b.owner].name + ' +8 Stone');
                  } else if(Player.list[b.owner].house){
                    var h = Player.list[b.owner].house;
                    House.list[h].stores.stone += 8;
                    console.log(House.list[h].name + ' +8 Stone');
                  } else {
                    Player.list[b.owner].stores.stone += 8
                    console.log(Player.list[b.owner].name + ' +8 Stone');
                  }
                } else {
                  if(!self.path){
                    self.moveTo(0,drop[0],drop[1]);
                  }
                }
              } else {
                if(loc.toString() == spot.toString()){
                  var tile = getTile(0,spot[0],spot[1]);
                  self.working = true;
                  self.mining = true;
                  if(!self.workTimer){
                    self.workTimer = true;
                    setTimeout(function(){
                      if(self.mining){
                        tileChange(6,spot[0],spot[1],-1,true);
                        self.inventory.stone += 10; // ALPHA
                        console.log(self.name + ' quarried 10 Stone');
                        var res = getTile(6,spot[0],spot[1]);
                        if(res <= 0){
                          tileChange(0,spot[0],spot[1],7);
                          mapEdit();
                          for(var i in hq.resources){
                            var f = hq.resources[i];
                            if(f.toString() == spot.toString()){
                              Building.list[self.work.hq].resources.splice(i,1);
                            }
                          }
                          self.action = null;
                        } else if(tile >= 5 && tile < 6 && res <= 50){
                          tileChange(0,spot[0],spot[1],-1,true);
                          mapEdit();
                        }
                      }
                      self.workTimer = false;
                      self.working = false;
                      self.mining = false;
                    },10000/self.strength);
                  }
                } else {
                  if(!self.path){
                    self.moveTo(0,spot[0],spot[1]);
                  }
                }
              }
            }
          }
        }
      } else if(self.action == 'clockout'){
        self.working = false;
        self.building = false;
        self.farming = false;
        self.chopping = false;
        self.mining = false;
        var b = Building.list[self.work.hq];
        var drop = [b.plot[0][0],b.plot[0][1]+1];
        if(loc.toString() == drop.toString()){
          self.facing = 'up';
          if(b.type == 'mill'){
            if(self.inventory.grain >= 3){
              self.inventory.grain -= 3;
              if(House.list[b.owner]){
                House.list[b.owner].stores.grain += 2;
                console.log(self.name + ' dropped off 2 Grain.');
              } else if(Player.list[b.owner].house){
                var h = Player.list[b.owner].house;
                House.list[h].stores.grain += 2;
                console.log(self.name + ' dropped off 2 Grain.');
              } else {
                Player.list[b.owner].stores.grain += 2;
                console.log(self.name + ' dropped off 2 Grain.');
              }
              self.inventory.flour++;
            } else {
              self.mode = 'idle';
            }
          } else if(b.type == 'lumbermill'){
            if(self.inventory.wood >= 3){
              self.inventory.wood -= 2;
              if(House.list[b.owner]){
                House.list[b.owner].stores.wood += 2;
                console.log(self.name + ' dropped off 2 Wood.');
              } else if(Player.list[b.owner].house){
                var h = Player.list[b.owner].house;
                House.list[h].stores.wood += 2;
                console.log(self.name + ' dropped off 2 Wood.');
              } else {
                Player.list[b.owner].stores.wood += 2;
                console.log(self.name + ' dropped off 2 Wood.');
              }
            } else {
              self.mode = 'idle';
            }
          } else if(b.type == 'mine'){
            if(b.cave){
              if(self.inventory.ironore >= 3){
                self.inventory.ironore -= 2;
                if(House.list[b.owner]){
                  House.list[b.owner].stores.ironore += 2;
                  console.log(self.name + ' dropped off 2 Iron Ore.');
                } else if(Player.list[b.owner].house){
                  var h = Player.list[b.owner].house;
                  House.list[h].stores.ironore += 2;
                  console.log(self.name + ' dropped off 2 Iron Ore.');
                } else {
                  Player.list[b.owner].stores.stone += 2;
                  console.log(self.name + ' dropped off 2 Iron Ore.');
                }
              } else if(self.inventory.silverore > 0){
                self.inventory.silverore--;
                if(House.list[b.owner]){
                  House.list[b.owner].stores.silverore ++;
                  console.log(self.name + ' dropped off 1 Silver Ore.');
                } else if(Player.list[b.owner].house){
                  var h = Player.list[b.owner].house;
                  House.list[h].stores.silverore++;
                  console.log(self.name + ' dropped off 1 Silver Ore.');
                } else {
                  Player.list[b.owner].stores.silverore++;
                  console.log(self.name + ' dropped off 1 Silver Ore.');
                }
              } else if(self.inventory.goldore > 0){
                self.inventory.goldore--;
                if(House.list[b.owner]){
                  House.list[b.owner].stores.goldore ++;
                  console.log(self.name + ' dropped off 1 Gold Ore.');
                } else if(Player.list[b.owner].house){
                  var h = Player.list[b.owner].house;
                  House.list[h].stores.goldore++;
                  console.log(self.name + ' dropped off 1 Gold Ore.');
                } else {
                  Player.list[b.owner].stores.goldore++;
                  console.log(self.name + ' dropped off 1 Gold Ore.');
                }
              } else if(self.inventory.diamond > 0){
                self.inventory.diamond--;
                if(House.list[b.owner]){
                  House.list[b.owner].stores.ironore ++;
                  console.log(self.name + ' dropped off 1 Diamond.');
                } else if(Player.list[b.owner].house){
                  var h = Player.list[b.owner].house;
                  House.list[h].stores.diamond++;
                  console.log(self.name + ' dropped off 1 Diamond.');
                } else {
                  Player.list[b.owner].stores.diamond++;
                  console.log(self.name + ' dropped off 1 Diamond.');
                }
              } else {
                self.mode = 'idle';
              }
            } else {
              if(self.inventory.stone >= 3){
                self.inventory.stone -= 2;
                if(House.list[b.owner]){
                  House.list[b.owner].stores.stone += 2;
                  console.log(self.name + ' dropped off 2 Stone.');
                } else if(Player.list[b.owner].house){
                  var h = Player.list[b.owner].house;
                  House.list[h].stores.stone += 2;
                  console.log(self.name + ' dropped off 2 Stone.');
                } else {
                  Player.list[b.owner].stores.stone += 2;
                  console.log(self.name + ' dropped off 2 Stone.');
                }
              } else {
                self.mode = 'idle'
              }
            }
          }
        } else {
          if(!self.path){
            self.moveTo(0,drop[0],drop[1]);
          }
        }
      } else if(self.action == 'combat'){
        self.action = 'flee';
      } else if(self.action == 'flee'){
        if(self.combat.target){
          var target = Player.list[self.combat.target];
          if(target){
            var tLoc = getLoc(target.x,target.y);
            self.reposition(loc,tLoc);
          } else {
            self.combat.target = null;
            self.action = null;
          }
        } else {
          self.action = null;
        }
      }
      // IDLE
    } else if(self.mode == 'idle'){
      if(!self.action){
        var cHome = getCenter(self.home.loc[0],self.home.loc[1]);
        var hDist = self.getDistance({
          x:cHome[0],
          y:cHome[1]
        });
        if(hDist > self.wanderRange){
          if(!self.path){
            self.return();
          }
        } else if(self.idleTime == 0){
          var col = loc[0];
          var row = loc[1];
          var select = [[col,row-1],[col-1,row],[col,row+1],[col+1,row]];
          var target = select[Math.floor(Math.random() * 4)];
          if(target[0] < mapSize && target[0] > -1 && target[1] < mapSize && target[1] > -1){
            if(isWalkable(self.z,target[0],target[1])){
              self.move(target);
              self.idleTime += Math.floor(Math.random() * self.idleRange);
            }
          }
        }
      } else if(self.action == 'clockout'){
        var rand = Math.random();
        if(self.tavern){
          if(Building.list[self.tavern].market){
            var inv = self.inventory;
            if(inv.flour > 0 || inv.wood > 0 || inv.stone > 0 || inv.ironore > 0){
              self.action = 'market';
              console.log(self.name + ' heads to the market');
            } else {
              if(rand < 0.2 && (inv.gold > 0 || inv.silver > 0)){
                self.action = 'market';
                console.log(self.name + ' heads to the market');
              } else if(rand > 0.9){
                self.action = null;
                console.log(self.name + ' heads home for the night');
              } else {
                self.action = 'tavern';
                console.log(self.name + ' heads to the tavern');
              }
            }
          } else {
            if(rand < 0.6){
              self.action = 'tavern';
              console.log(self.name + ' heads to the tavern');
            } else {
              self.action = null;
              console.log(self.name + ' heads home for the night');
            }
          }
        } else {
          self.action = null;
          console.log(self.name + ' heads home for the night');
        }
      } else if(self.action == 'market'){
        var market = Building.list[self.tavern].market;
        var m = Building.list[market];
        if(getBuilding(self.x,self.y) != market){
          if(!self.path){
            var rand = Math.floor(Math.random() * m.plot.length);
            var dest = m.plot[rand];
            self.tether = {z:1,loc:dest};
            self.moveTo(1,dest[0],dest[1]);
          }
        } else {
          var inv = self.inventory;
          // if has inventory, sell inventory
          if(inv.flour > 0){
            // sell
          } else if(inv.wood > 0){
            // sell
          } else if(inv.stone > 0){
            // sell
          } else if(inv.ironore > 0){
            // sell
          } else {
            if(inv.silver > 0 || inv.gold > 0){
              // buy something nice
            }
            if(!self.dayTimer){
              self.dayTimer = true;
              var rand = Math.floor(Math.random() * (3600000/(period/3)));
              setTimeout(function(){
                self.tether = null;
                self.action = 'tavern';
                self.dayTimer = false;
                console.log(self.name + ' heads to the tavern');
              },rand);
            }
            var ct = getCenter(self.tether.loc[0],self.tether.loc[1]);
            var tDist = self.getDistance({
              x:ct[0],
              y:ct[1]
            });
            if(tDist > self.wanderRange){
              if(!self.path){
                self.return();
              }
            } else if(self.idleTime == 0){
              var col = loc[0];
              var row = loc[1];
              var select = [[col,row-1],[col-1,row],[col,row+1],[col+1,row]];
              var target = select[Math.floor(Math.random() * 4)];
              if(target[0] < mapSize && target[0] > -1 && target[1] < mapSize && target[1] > -1){
                if(isWalkable(self.z,target[0],target[1])){
                  self.move(target);
                  self.idleTime += Math.floor(Math.random() * self.idleRange);
                }
              }
            }
          }
        }
      } else if(self.action == 'tavern'){
        var t = Building.list[self.tavern];
        if(getBuilding(self.x,self.y) != self.tavern){
          if(!self.path){
            var select = [];
            for(var i in t.plot){
              var p = t.plot[i];
              if(isWalkable(1,p[0],p[1])){
                select.push(p);
              }
            }
            var rand = Math.floor(Math.random() * select.length);
            var dest = select[rand];
            self.tether = {z:1,loc:dest};
            self.moveTo(1,dest[0],dest[1]);
          }
        } else {
          var ct = getCenter(self.tether.loc[0],self.tether.loc[1]);
          var tDist = self.getDistance({
            x:ct[0],
            y:ct[1]
          });
          if(tDist > self.wanderRange){
            if(!self.path){
              self.return();
            }
          } else if(self.idleTime == 0){
            var col = loc[0];
            var row = loc[1];
            var select = [[col,row-1],[col-1,row],[col,row+1],[col+1,row]];
            var target = select[Math.floor(Math.random() * 4)];
            if(target[0] < mapSize && target[0] > -1 && target[1] < mapSize && target[1] > -1){
              if(isWalkable(self.z,target[0],target[1])){
                self.move(target);
                self.idleTime += Math.floor(Math.random() * self.idleRange);
              }
            }
          }
        }
      } else if(self.action == 'combat'){
        self.action = 'flee';
      } else if(self.action == 'flee'){
        if(self.combat.target){
          var target = Player.list[self.combat.target];
          if(target){
            var tLoc = getLoc(target.x,target.y);
            self.reposition(loc,tLoc);
          } else {
            self.combat.target = null;
            self.action = null;
          }
        } else {
          self.action = null;
        }
      }
    }
    self.updatePosition();
  }
}

SerfF = function(param){
  var self = Character(param);
  self.name = param.name;
  self.class = 'SerfF';
  self.sex = 'f';
  self.spriteSize = tileSize*1.5;
  self.unarmed = true;
  self.tether = null; // {z,loc}
  self.tavern = param.tavern;
  self.hut = param.hut;
  self.work = {hq:null,spot:null}; // {hq,spot}
  self.dayTimer = false;
  self.workTimer = false;

  self.update = function(){
    var loc = getLoc(self.x,self.y);
    var b = getBuilding(self.x,self.y);
    self.zoneCheck();

    if(self.z == 0){
      if(getTile(0,loc[0],loc[1]) == 6){
        self.caveEntrance = loc;
        self.z = -1;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd * self.drag;
      } else if(getTile(0,loc[0],loc[1]) >= 1 && getTile(0,loc[0],loc[1]) < 2){
        self.innaWoods = true;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.3) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) >= 2 && getTile(0,loc[0],loc[1]) < 4){
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.5) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) >= 4 && getTile(0,loc[0],loc[1]) < 5){
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.6) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6 && !self.onMtn){
        self.innaWoods = false;
        self.maxSpd = (self.baseSpd * 0.2) * self.drag;
        setTimeout(function(){
          if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6){
            self.onMtn = true;
          }
        },2000);
      } else if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6 && self.onMtn){
        self.maxSpd = (self.baseSpd * 0.5) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 18){
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 1.1) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 14 || getTile(0,loc[0],loc[1]) == 16 || getTile(0,loc[0],loc[1]) == 19){
        Building.list[b].occ++;
        self.z = 1;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 0){
        self.z = -3;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.2)  * self.drag;
      } else {
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd  * self.drag;
      }
    } else if(self.z == -1){
      if(getTile(1,loc[0],loc[1]) == 2){
        self.caveEntrance = null;
        self.z = 0;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.9)  * self.drag;
      }
    } else if(self.z == -2){
      if(getTile(8,loc[0],loc[1]) == 5){
        self.z = 1;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down';
      }
    } else if(self.z == -3){
      if(self.breath > 0){
        self.breath -= 0.25;
      } else {
        self.hp -= 0.5;
      }
      if(self.hp <= 0){
        self.die({cause:'drowned'});
      }
      if(getTile(0,loc[0],loc[1]) != 0){
        self.z = 0;
        self.path = null;
        self.pathCount = 0;
        self.breath = self.breathMax;
      }
    } else if(self.z == 1){
      if(getTile(0,loc[0],loc[1] - 1) == 14 || getTile(0,loc[0],loc[1] - 1) == 16  || getTile(0,loc[0],loc[1] - 1) == 19){
        var exit = getBuilding(self.x,self.y-tileSize);
        Building.list[exit].occ--;
        self.z = 0;
        self.path = null;
        self.pathCount = 0;
      } else if(getTile(4,loc[0],loc[1]) == 3 || getTile(4,loc[0],loc[1]) == 4 || getTile(4,loc[0],loc[1]) == 7){
        self.z = 2;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down'
      } else if(getTile(4,loc[0],loc[1]) == 5 || getTile(4,loc[0],loc[1]) == 6){
        self.z = -2;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down';
      }
    } else if(self.z == 2){
      if(getTile(4,loc[0],loc[1]) == 3 || getTile(4,loc[0],loc[1]) == 4){
        self.z = 1;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down';
      }
    }

    if(tempus == 'VI.a' && self.mode !== 'work' && !self.dayTimer){
      self.dayTimer = true;
      var rand = Math.floor(Math.random() * (3600000/(period*6)));
      setTimeout(function(){
        self.mode = 'work';
        self.action = null;
        self.dayTimer = false;
        console.log(self.name + ' heads to work');
      },rand);
    } else if(tempus == 'VI.p' && self.action == 'task' && !self.dayTimer){
      self.dayTimer = true;
      var rand = Math.floor(Math.random() * (3600000/(period*6)));
      setTimeout(function(){
        self.action = 'clockout';
        self.dayTimer = false;
        console.log(self.name + ' is clocking out');
      },rand);
    } else if(tempus == 'XI.p' && self.action == 'tavern' && !self.dayTimer){
      self.dayTimer = true;
      var rand = Math.floor(Math.random() * (3600000/(period/2)));
      setTimeout(function(){
        self.tether = null;
        self.action = null;
        self.dayTimer = false;
        console.log(self.name + ' heads home for the night');
      },rand);
    }

    if(self.idleTime > 0){
      self.idleTime--;
    }

    // WORK
    if(self.mode == 'work'){
      if(!Building.list[self.hut].built){
        var hut = Building.list[self.hut];
        var select = [];
        for(var i in hut.plot){
          var p = hut.plot[i];
          var t = getTile(0,p[0],p[1]);
          if(t == 11){
            select.push(p);
          }
        }
        self.work.spot = select[Math.floor(Math.random() * select.length)];
        self.action = 'build';
      } else if(self.work.hq){
        var hq = Building.list[self.work.hq];
        if(!self.action){
          if(Building.list[self.hut].built){ // if hut is built
            var tDist = 0;
            var avgDist = null;
            for(var i in hq.resources){
              var res = hq.resources[i];
              var r = getCenter(res[0],res[1]);
              var dist = getDistance({x:hq.x,y:hq.y},{x:r[0],y:r[1]});
              tDist += dist;
            }
            avgDist = tDist/hq.resources.length;
            var select = [];
            for(var i in hq.resources){
              var res = hq.resources[i];
              var r = getCenter(res[0],res[1]);
              var dist = getDistance({x:hq.x,y:hq.y},{x:r[0],y:r[1]});
              if(dist <= avgDist){
                select.push(res);
              }
            }
            self.work.spot = select[Math.floor(Math.random() * select.length)];
            Building.list[self.work.hq].log[self.id] = self.work.spot;
            self.action = 'task';
            if(self.work.spot){
              console.log(self.name + ' working @ ' + hq.type);
            } else {
              console.log(self.name + ' failed to find work spot @ ' + hq.type);
            }
          }
        } else if(self.action == 'build'){
          var spot = self.work.spot;
          var cs = getCenter(spot[0],spot[1]);
          var build = getBuilding(cs[0],cs[1]);
          if(Building.list[build].built){
            self.work.spot = null;
            self.action = null;
          } else {
            if(loc.toString() == spot.toString()){
                var gt = getTile(0,spot[0],spot[1]);
                if(gt == 11){
                  if(!self.building){
                    Build(self.id);
                  }
                } else {
                  var plot = Building.list[build].plot;
                  var select = [];
                  for(var i in plot){
                    var p = plot[i];
                    var t = getTile(0,p[0],p[1]);
                    if(t == 11){
                      select.push(p);
                    }
                  }
                  self.work.spot = select[Math.floor(Math.random() * select.length)];
                }
            } else {
              if(!self.path){
                self.moveTo(0,spot[0],spot[1]);
              }
            }
          }
        } else if(self.action == 'task'){
          var spot = self.work.spot;
          if(!spot){
            self.action = null;
          } else {
            if(self.inventory.grain == 10){
              var hq = Building.list[self.work.hq];
              var dropoff = [hq.plot[0][0],hq.plot[0][1]+1];
              if(loc.toString() == dropoff.toString()){
                self.facing = 'up';
                self.inventory.grain -= 9;
                if(Player.list[hq.owner].house){
                  var h = Player.list[hq.owner].house;
                  House.list[h].stores.grain += 6;
                } else {
                  Player.list[hq.owner].stores.grain += 6
                }
                self.inventory.flour += 3;
              } else {
                if(!self.path){
                  self.moveTo(0,dropoff[0],dropoff[1]);
                }
              }
            } else {
              if(loc.toString() == spot.toString()){
                var tile = getTile(0,spot[0],spot[1]);
                var res = getTile(6,spot[0],spot[1]);
                self.working = true;
                self.farming = true;
                if(!self.workTimer){
                  self.workTimer = true;
                  setTimeout(function(){
                    if(self.farming){
                      var b = getBuilding(self.x,self.y);
                      var f = Building.list[b];
                      if(tile == 8){
                        tileChange(6,spot[0],spot[1],1,true);
                        var count = 0;
                        var next = [];
                        for(var i in f.plot){
                          var p = f.plot[i];
                          if(getTile(6,p[0],p[1]) >= 25){
                            count++;
                          } else {
                            next.push(p);
                          }
                        }
                        if(count == 9){
                          for(var i in f.plot){
                            var p = f.plot[i];
                            tileChange(0,p[0],p[1],9);
                          }
                          mapEdit();
                        } else {
                          for(var n in hq.resources){
                            var r = hq.resources[n];
                            if(r.toString() == spot.toString()){
                              Building.list[self.work.hq].resources.splice(n,1);
                            }
                          }
                          var rand = Math.floor(Math.random() * next.length);
                          self.work.spot = next[rand];
                          Building.list[self.work.hq].log[self.id] = self.work.spot;
                        }
                      } else if(tile == 9){
                        tileChange(6,spot[0],spot[1],1,true);
                        var count = 0;
                        var next = [];
                        for(var i in f.plot){
                          var p = f.plot[i];
                          if(getTile(6,p[0],p[1]) >= 50){
                            count++;
                          }
                        }
                        if(count == 9){
                          for(var i in f.plot){
                            var p = f.plot[i];
                            tileChange(0,p[0],p[1],10);
                          }
                          mapEdit();
                        } else {
                          for(var n in hq.resources){
                            var r = hq.resources[n];
                            if(r.toString() == spot.toString()){
                              Building.list[self.work.hq].resources.splice(n,1);
                            }
                          }
                          var rand = Math.floor(Math.random() * next.length);
                          self.work.spot = next[rand];
                          Building.list[self.work.hq].log[self.id] = self.work.spot;
                        }
                      } else {
                        tileChange(6,spot[0],spot[1],-1,true);
                        if(getTile(6,spot[0],spot[1]) == 0){
                          tileChange(0,spot[0],spot[1],8);
                          var count = 0;
                          var next = [];
                          for(var i in f.plot){
                            var p = f.plot[i]
                            var t = getTile(0,p[0],p[1]);
                            if(t == 8){
                              count++;
                            } else {
                              next.push(p);
                            }
                          }
                          if(count == 9){
                            for(var n in f.plot){
                              var p = f.plot[n];
                              if(p.toString() == spot.toString()){
                                continue;
                              } else {
                                Building.list[self.work.hq].resources.push(p);
                              }
                            }
                          } else {
                            for(var n in hq.resources){
                              var r = hq.resources[n];
                              if(r.toString() == spot.toString()){
                                Building.list[self.work.hq].resources.splice(n,1);
                              }
                            }
                            var rand = Math.floor(Math.random() * next.length);
                            self.work.spot = next[rand];
                            Building.list[self.work.hq].log[self.id] = self.work.spot;
                          }
                        }
                        mapEdit();
                      }
                    }
                    self.workTimer = false;
                    self.working = false;
                    self.farming = false;
                  },10000/self.strength);
                }
              } else {
                if(!self.path){
                  self.moveTo(0,spot[0],spot[1]);
                }
              }
            }
          }
        } else if(self.action == 'clockout'){
          self.working = false;
          self.building = false;
          self.farming = false;
          self.chopping = false;
          self.mining = false;
          var b = Building.list[self.work.hq];
          var drop = [b.plot[0][0],b.plot[0][1]+1];
          if(loc.toString() == drop.toString()){
            self.facing = 'up';
            if(self.inventory.grain >= 3){
              self.inventory.grain -= 3;
              if(Player.list[b.owner].house){
                var h = Player.list[b.owner].house;
                House.list[h].stores.grain += 2;
              } else {
                Player.list[b.owner].stores.grain += 2
              }
              self.inventory.flour++;
            } else {
              self.mode = 'idle';
            }
          } else {
            if(!self.path){
              self.moveTo(0,drop[0],drop[1]);
            }
          }
        } else if(self.action == 'combat'){
          self.action = 'flee';
        } else if(self.action == 'flee'){
          if(self.combat.target){
            var target = Player.list[self.combat.target];
            if(target){
              var tLoc = getLoc(target.x,target.y);
              self.reposition(loc,tLoc);
            } else {
              self.combat.target = null;
              self.action = null;
            }
          } else {
            self.action = null;
          }
        }
      }
      // IDLE
    } else if(self.mode == 'idle'){
      if(!self.action){
        var cHome = getCenter(self.home.loc[0],self.home.loc[1]);
        var hDist = self.getDistance({
          x:cHome[0],
          y:cHome[1]
        });
        if(hDist > self.wanderRange){
          if(!self.path){
            self.return();
          }
        } else if(self.idleTime == 0){
          var col = loc[0];
          var row = loc[1];
          var select = [[col,row-1],[col-1,row],[col,row+1],[col+1,row]];
          var target = select[Math.floor(Math.random() * 4)];
          if(target[0] < mapSize && target[0] > -1 && target[1] < mapSize && target[1] > -1){
            if(isWalkable(self.z,target[0],target[1])){
              self.move(target);
              self.idleTime += Math.floor(Math.random() * self.idleRange);
            }
          }
        }
      } else if(self.action == 'clockout'){
        var rand = Math.random();
        if(self.tavern){
          if(Building.list[self.tavern].market){
            var inv = self.inventory;
            if(inv.flour > 0 || inv.wood > 0 || inv.stone > 0 || inv.ironore > 0){
              self.action = 'market';
              console.log(self.name + ' heads to the market');
            } else {
              if(rand < 0.2 && (inv.gold > 0 || inv.silver > 0)){
                self.action = 'market';
                console.log(self.name + ' heads to the market');
              } else if(rand > 0.8){
                self.action = 'tavern';
                console.log(self.name + ' heads to the tavern');
              } else {
                self.action = null;
                console.log(self.name + ' heads home for the night');
              }
            }
          } else {
            if(rand < 0.8){
              self.action = null;
              console.log(self.name + ' heads home for the night');
            } else {
              self.action = 'tavern';
              console.log(self.name + ' heads to the tavern');
            }
          }
        } else {
          self.action = null;
          console.log(self.name + ' heads home for the night');
        }
      } else if(self.action == 'market'){
        var market = Building.list[self.tavern].market;
        var m = Building.list[market];
        if(getBuilding(self.x,self.y) != market){
          if(!self.path){
            var rand = Math.floor(Math.random() * m.plot.length);
            var dest = m.plot[rand];
            self.tether = {z:1,loc:dest};
            self.moveTo(1,dest[0],dest[1]);
          }
        } else {
          var inv = self.inventory;
          // if has inventory, sell inventory
          if(inv.bread > 0){
            // sell
          } else {
            if(inv.silver > 0 || inv.gold > 0){
              // buy something nice
            }
            if(!self.dayTimer){
              self.dayTimer = true;
              var rand = Math.floor(Math.random() * (3600000/(period/3)));
              setTimeout(function(){
                self.tether = null;
                self.action = null;
                self.dayTimer = false;
                console.log(self.name + ' heads home for the night');
              },rand);
            }
            var ct = getCenter(self.tether.loc[0],self.tether.loc[1]);
            var tDist = self.getDistance({
              x:ct[0],
              y:ct[1]
            });
            if(tDist > self.wanderRange){
              if(!self.path){
                self.return();
              }
            } else if(self.idleTime == 0){
              var col = loc[0];
              var row = loc[1];
              var select = [[col,row-1],[col-1,row],[col,row+1],[col+1,row]];
              var target = select[Math.floor(Math.random() * 4)];
              if(target[0] < mapSize && target[0] > -1 && target[1] < mapSize && target[1] > -1){
                if(isWalkable(self.z,target[0],target[1])){
                  self.move(target);
                  self.idleTime += Math.floor(Math.random() * self.idleRange);
                }
              }
            }
          }
        }
      } else if(self.action == 'tavern'){
        var t = Building.list[self.tavern];
        if(getBuilding(self.x,self.y) != self.tavern){
          if(!self.path){
            var select = [];
            for(var i in t.plot){
              var p = t.plot[i];
              if(isWalkable(1,p[0],p[1])){
                select.push(p);
              }
            }
            var rand = Math.floor(Math.random() * select.length);
            var dest = select[rand];
            self.tether = {z:1,loc:dest};
            self.moveTo(1,dest[0],dest[1]);
          }
        } else {
          var ct = getCenter(self.tether.loc[0],self.tether.loc[1]);
          var tDist = self.getDistance({
            x:ct[0],
            y:ct[1]
          });
          if(tDist > self.wanderRange){
            if(!self.path){
              self.return();
            }
          } else if(self.idleTime == 0){
            var col = loc[0];
            var row = loc[1];
            var select = [[col,row-1],[col-1,row],[col,row+1],[col+1,row]];
            var target = select[Math.floor(Math.random() * 4)];
            if(target[0] < mapSize && target[0] > -1 && target[1] < mapSize && target[1] > -1){
              if(isWalkable(self.z,target[0],target[1])){
                self.move(target);
                self.idleTime += Math.floor(Math.random() * self.idleRange);
              }
            }
          }
        }
      } else if(self.action == 'combat'){
        self.action = 'flee';
      } else if(self.action == 'flee'){
        if(self.combat.target){
          var target = Player.list[self.combat.target];
          if(target){
            var tLoc = getLoc(target.x,target.y);
            self.reposition(loc,tLoc);
          } else {
            self.combat.target = null;
            self.action = null;
          }
        } else {
          self.action = null;
        }
      }
    }
    self.updatePosition();
  }
}

Innkeeper = function(param){
  var self = Character(param);
  self.name = param.name;
  self.class = 'Innkeeper';
  self.sex = 'm';
  self.spriteSize = tileSize*1.5;
  self.baseSpd = 3;
  self.torchBearer = true;
  self.unarmed = true;
}

Blacksmith = function(param){
  var self = Character(param);
  self.name = param.name;
  self.class = 'SerfM';
  self.sex = 'm';
  self.unarmed = true;
  self.forge = param.forge;
  self.work = 100;

  self.update = function(){
    var loc = getLoc(self.x,self.y);
    var b = getBuilding(self.x,self.y);
    self.zoneCheck();

    if(self.z == 0){
      if(getTile(0,loc[0],loc[1]) == 6){
        self.z = -1;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd * self.drag;
      } else if(getTile(0,loc[0],loc[1]) >= 1 && getTile(0,loc[0],loc[1]) < 2){
        self.innaWoods = true;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.3) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) >= 2 && getTile(0,loc[0],loc[1]) < 4){
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.5) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) >= 4 && getTile(0,loc[0],loc[1]) < 5){
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.6) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6 && !self.onMtn){
        self.innaWoods = false;
        self.maxSpd = (self.baseSpd * 0.2) * self.drag;
        setTimeout(function(){
          if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6){
            self.onMtn = true;
          }
        },2000);
      } else if(getTile(0,loc[0],loc[1]) >= 5 && getTile(0,loc[0],loc[1]) < 6 && self.onMtn){
        self.maxSpd = (self.baseSpd * 0.5) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 18){
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 1.1) * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 14 || getTile(0,loc[0],loc[1]) == 16 || getTile(0,loc[0],loc[1]) == 19){
        Building.list[b].occ++;
        self.z = 1;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd * self.drag;
      } else if(getTile(0,loc[0],loc[1]) == 0){
        self.z = -3;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.2)  * self.drag;
      } else {
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = self.baseSpd  * self.drag;
      }
    } else if(self.z == -1){
      if(getTile(1,loc[0],loc[1]) == 2){
        self.z = 0;
        self.path = null;
        self.pathCount = 0;
        self.innaWoods = false;
        self.onMtn = false;
        self.maxSpd = (self.baseSpd * 0.9)  * self.drag;
      }
    } else if(self.z == -2){
      if(getTile(8,loc[0],loc[1]) == 5){
        self.z = 1;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down';
      }
    } else if(self.z == -3){
      if(self.breath > 0){
        self.breath -= 0.25;
      } else {
        self.hp -= 0.5;
      }
      if(self.hp <= 0){
        self.die({cause:'drowned'});
      }
      if(getTile(0,loc[0],loc[1]) != 0){
        self.z = 0;
        self.path = null;
        self.pathCount = 0;
        self.breath = self.breathMax;
      }
    } else if(self.z == 1){
      if(getTile(0,loc[0],loc[1] - 1) == 14 || getTile(0,loc[0],loc[1] - 1) == 16  || getTile(0,loc[0],loc[1] - 1) == 19){
        var exit = getBuilding(self.x,self.y-tileSize);
        Building.list[exit].occ--;
        self.z = 0;
        self.path = null;
        self.pathCount = 0;
      } else if(getTile(4,loc[0],loc[1]) == 3 || getTile(4,loc[0],loc[1]) == 4 || getTile(4,loc[0],loc[1]) == 7){
        self.z = 2;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down'
      } else if(getTile(4,loc[0],loc[1]) == 5 || getTile(4,loc[0],loc[1]) == 6){
        self.z = -2;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down';
      }
    } else if(self.z == 2){
      if(getTile(4,loc[0],loc[1]) == 3 || getTile(4,loc[0],loc[1]) == 4){
        self.z = 1;
        self.path = null;
        self.pathCount = 0;
        self.y += (tileSize/2);
        self.facing = 'down';
      }
    }

    if(self.idleTime > 0){
      self.idleTime--;
    }

    //WORK
    if(self.mode == 'work'){
      if(self.loc.toString() != self.home.loc.toString()){
        if(!self.path){
          self.return();
        }
      } else {
        if(!self.action){
          self.facing = 'right';
          self.working = true;
          self.building = true;
          if(self.work > 0){
            self.work--;
          } else {
            if(self.house){
              var goldore = House.list[self.house].stores.goldore;
              var silverore = House.list[self.house].stores.silverore;
              var ironore = House.list[self.house].stores.ironore;
              if(goldore > 0){
                House.list[self.house].stores.goldore--;
                House.list[self.house].stores.gold++;
                console.log('Blacksmith: +1 gold');
                self.work += 100;
              } else if(silverore > 0){
                House.list[self.house].stores.silverore--;
                House.list[self.house].stores.silver++;
                console.log('Blacksmith: +1 silver');
                self.work += 100;
              } else if(ironore > 0){
                House.list[self.house].stores.ironore--;
                House.list[self.house].stores.iron++;
                console.log('Blacksmith: +1 iron');
                self.work += 100;
              } else {
                self.mode = 'idle';
                console.log('Blacksmith done');
              }
            } else {
              var p = Building.list[self.forge].owner;
              var goldore = Player.list[p].stores.goldore;
              var silverore = Player.list[p].stores.silverore;
              var ironore = Player.list[p].stores.ironore;
              if(goldore > 0){
                Player.list[p].stores.goldore--;
                Player.list[p].stores.gold++;
                console.log('Blacksmith: +1 gold');
                self.work += 100;
              } else if(silverore > 0){
                Player.list[p].stores.silverore--;
                Player.list[p].stores.silver++;
                console.log('Blacksmith: +1 silver');
                self.work += 100;
              } else if(ironore > 0){
                Player.list[p].stores.ironore--;
                Player.list[p].stores.iron++;
                console.log('Blacksmith: +1 iron');
                self.work += 100;
              } else {
                self.mode = 'idle';
                console.log('Blacksmith done');
              }
            }
          }
        } else if(self.action == 'combat'){
          self.action = 'flee';
        } else if(self.action == 'flee'){
          if(self.combat.target){
            var target = Player.list[self.combat.target];
            if(target){
              var tLoc = getLoc(target.x,target.y);
              self.reposition(loc,tLoc);
            } else {
              self.combat.target = null;
              self.action = null;
            }
          } else {
            self.action = null;
          }
        }
      }
      //IDLE
    } else if(self.mode == 'idle'){
      if(!self.action){
        var cHome = getCenter(self.home.loc[0],self.home.loc[1]);
        var hDist = self.getDistance({
          x:cHome[0],
          y:cHome[1]
        });
        if(hDist > self.wanderRange){
          if(!self.path){
            self.return();
          }
        } else if(self.idleTime == 0){
          var col = loc[0];
          var row = loc[1];
          var select = [[col,row-1],[col-1,row],[col,row+1],[col+1,row]];
          var target = select[Math.floor(Math.random() * 4)];
          if(target[0] < mapSize && target[0] > -1 && target[1] < mapSize && target[1] > -1){
            if(isWalkable(self.z,target[0],target[1])){
              self.move(target);
              self.idleTime += Math.floor(Math.random() * self.idleRange);
            }
          }
        }
      } else if(self.action == 'combat'){
        self.action = 'flee';
      } else if(self.action == 'flee'){
        if(self.combat.target){
          var target = Player.list[self.combat.target];
          if(target){
            var tLoc = getLoc(target.x,target.y);
            self.reposition(loc,tLoc);
          } else {
            self.combat.target = null;
            self.action = null;
          }
        } else {
          self.action = null;
        }
      }
    }
    self.updatePosition();
  }
  Building.list[self.forge].blacksmith = self.id;
}

Monk = function(param){
  var self = Character(param);
  self.name = param.name;
  self.class = 'Monk';
  self.sex = 'm';
  self.cleric = true;
  self.baseSpd = 2;
}

Bishop = function(param){
  var self = Character(param);
  self.name = param.name;
  self.class = 'Bishop';
  self.sex = 'm';
  self.rank = '♝ ';
  self.cleric = true;
  self.baseSpd = 2;
}

Friar = function(param){
  var self = Character(param);
  self.name = param.name;
  self.class = 'Friar';
  self.sex = 'm';
  self.spriteSize = tileSize*1.5;
  self.mounted = true;
  self.cleric = true;
  self.baseSpd = 2;
  self.torchBearer = true;
}

Shipwright = function(param){
  var self = Character(param);
  self.name = param.name;
  self.class = 'Shipwright';
  self.sex = 'm';
  self.spriteSize = tileSize*1.5;
  self.baseSpd = 3;
  self.torchBearer = true;
  self.unarmed = true;
}

Footsoldier = function(param){
  var self = Character(param);
  self.name = 'Footsoldier';
  self.class = 'Footsoldier';
  self.sex = 'm';
  self.military = true;
  self.spriteSize = tileSize*1.5;
  self.baseSpd = 3.5;
  self.damage = 10;
}

Skirmisher = function(param){
  var self = Character(param);
  self.name = 'Skirmisher';
  self.class = 'Skirmisher';
  self.sex = 'm';
  self.military = true;
  self.spriteSize = tileSize*1.5;
  self.baseSpd = 3.5;
  self.damage = 15;
}

Cavalier = function(param){
  var self = Character(param);
  self.name = 'Cavalier';
  self.class = 'Cavalier';
  self.sex = 'm';
  self.military = true;
  self.spriteSize = tileSize*1.5;
  self.mounted = true;
  self.baseSpd = 6.5;
  self.damage = 20;
}

General = function(param){
  var self = Character(param);
  self.name = param.name;
  self.class = 'General';
  self.sex = 'm';
  self.rank = '♞ ';
  self.spriteSize = tileSize*2;
  self.mounted = true;
  self.baseSpd = 6.5;
  self.damage = 25;
}

Warden = function(param){
  var self = Character(param);
  self.name = 'Warden';
  self.class = 'Warden';
  self.sex = 'm';
  self.rank = '♞ ';
  self.spriteSize = tileSize*2;
  self.mounted = true;
  self.ranged = true;
  self.baseSpd = 7;
  self.torchBearer = true;
  self.damage = 20;
}

SwissGuard = function(param){
  var self = Character(param);
  self.name = 'Swiss Guard';
  self.class = 'SwissGuard';
  self.sex = 'm';
  self.spriteSize = tileSize*2;
  self.damage = 15;
}

Hospitaller = function(param){
  var self = Character(param);
  self.name = 'Hospitaller';
  self.class = 'Hospitaller';
  self.sex = 'm';
  self.spriteSize = tileSize*1.5;
  self.baseSpd = 3;
  self.damage = 20;
}

ImperialKnight = function(param){
  var self = Character(param);
  self.name = 'Imperial Knight';
  self.class = 'ImperialKnight';
  self.sex = 'm';
  self.rank = '♞ ';
  self.mounted = true;
  self.baseSpd = 6;
  self.spriteSize = tileSize*3;
  self.damage = 25;
}

Trebuchet = function(param){
  var self = Character(param);
  self.class = 'Trebuchet';
  self.spriteSize = tileSize*10;
  self.ranged = true;
  self.damage = 100;
}

BombardCannon = function(param){
  var self = Character(param);
  self.class = 'BombardCannon';
  self.baseSpd = 2;
  self.ranged = true;
  self.damage = 250;
}

TradeCart = function(param){
  var self = Character(param);
  self.class = 'TradeCart';
  self.mounted = true;
  self.baseSpd = 2;
  self.torchBearer = true;
}

Merchant = function(param){
  var self = Character(param);
  self.class = 'Merchant';
  self.sex = 'm';
  self.baseSpd = 2;
  self.torchBearer = true;
}

FishingBoat = function(param){
  var self = Character(param);
  self.class = 'FishingBoat';
}

CargoShip = function(param){
  var self = Character(param);
  self.class = 'CargoShip';
  self.torchBearer = true;
}

Galley = function(param){
  var self = Character(param);
  self.class = 'Galley';
  self.ranged = true;
  self.torchBearer = true;
  self.damage = 15;
}

Caravel = function(param){
  var self = Character(param);
  self.class = 'Caravel';
  self.ranged = true;
  self.torchBearer = true;
}

Galleon = function(param){
  var self = Character(param);
  self.class = 'Galleon';
  self.rank = '♜ ';
  self.ranged = true;
  self.torchBearer = true;
  self.damage = 150;
}

// ENEMIES

Brother = function(param){
  var self = Character(param);
  self.name = 'Brother';
  self.class = 'Brother';
  self.sex = 'm';
  self.spriteSize = tileSize*1.5;
  self.baseSpd = 3.5;
  self.damage = 5;
}

Oathkeeper = function(param){
  var self = Character(param);
  self.name = 'Oathkeeper';
  self.class = 'Oathkeeper';
  self.sex = 'm';
  self.rank = '♝ ';
  self.spriteSize = tileSize*1.5;
  self.cleric = true;
  self.baseSpd = 3.5;
  self.torchBearer = true;
}

Apparition = function(param){
  var self = Character(param);
  self.class = 'Apparition';
  self.spriteSize = tileSize*1.5;
  self.damage = 1;
}

Apollyon = function(param){
  var self = Character(param);
  self.name = 'APOLLYON';
  self.class = 'Apollyon';
  self.sex = 'm';
  self.rank = '♚ ';
  self.house = 'City of Destruction';
}

Goth = function(param){
  var self = Character(param);
  self.name = 'Goth';
  self.class = 'Goth';
  self.sex = 'm';
  self.military = true;
  self.spriteSize = tileSize*1.5;
  self.damage = 10;
}

Cataphract = function(param){
  var self = Character(param);
  self.name = 'Cataphract';
  self.class = 'Cataphract';
  self.sex = 'm';
  self.military = true;
  self.rank = '♞ ';
  self.mounted = true;
  self.spriteSize = tileSize*3;
  self.baseSpd = 6;
  self.damage = 20;
}

Acolyte = function(param){
  var self = Character(param);
  self.name = 'Acolyte';
  self.class = 'Acolyte';
  self.sex = 'm';
  self.spriteSize = tileSize*1.5;
  self.baseSpd = 3.5;
  self.torchBearer = true;
  self.damage = 5;
}

HighPriestess = function(param){
  var self = Character(param);
  self.name = 'High Priestess';
  self.class = 'HighPriestess';
  self.sex = 'f';
  self.rank = '♝ ';
  self.spriteSize = tileSize*1.5;
  self.cleric = true;
  self.baseSpd = 3.5;
  self.torchBearer = true;
}

Alaric = function(param){
  var self = Character(param);
  self.name = 'Alaric I';
  self.class = 'Alaric';
  self.sex = 'm';
  self.rank = '♜ ';
}

Drakkar = function(param){
  var self = Character(param);
  self.name = 'Drakkar';
  self.class = 'Drakkar';
  self.ranged = true;
  self.torchBearer = true;
  self.damage = 15;
}

NorseSword = function(param){
  var self = Character(param);
  self.name = 'Norseman';
  self.class = 'NorseSword';
  self.sex = 'm';
  self.military = true;
  self.spriteSize = tileSize*1.5;
  self.damage = 15;
}

NorseSpear = function(param){
  var self = Character(param);
  self.name = 'Norseman';
  self.class = 'NorseSpear';
  self.sex = 'm';
  self.military = true;
  self.spriteSize = tileSize*1.5;
  self.damage = 15;
}

Seidr = function(param){
  var self = Character(param);
  self.name = 'Seidr';
  self.class = 'Seidr';
  self.sex = 'm';
  self.rank = '♝ ';
  self.cleric = true;
  self.baseSpd = 2;
}

Huskarl = function(param){
  var self = Character(param);
  self.name = 'Huskarl';
  self.class = 'Huskarl';
  self.sex = 'm';
  self.military = true;
  self.rank = '♞ ';
  self.spriteSize = tileSize*1.5;
  self.baseSpd = 3;
  self.damage = 20;
}

FrankSword = function(param){
  var self = Character(param);
  self.name = 'Frank';
  self.class = 'FrankSword';
  self.sex = 'm';
  self.military = true;
  self.damage = 10;
}

FrankSpear = function(param){
  var self = Character(param);
  self.name = 'Frank';
  self.class = 'FrankSpear';
  self.sex = 'm';
  self.military = true;
  self.spriteSize = tileSize*2;
  self.damage = 10;
}

FrankBow = function(param){
  var self = Character(param);
  self.name = 'Frank';
  self.class = 'FrankBow';
  self.sex = 'm';
  self.military = true;
  self.spriteSize = tileSize*1.5;
  self.ranged = true;
  self.damage = 5;
}

Mangonel = function(param){
  var self = Character(param);
  self.name = 'Mangonel';
  self.class = 'Mangonel';
  self.baseSpd = 2;
  self.spriteSize = tileSize*2;
  self.ranged = true;
  self.damage = 50;
}

Carolingian = function(param){
  var self = Character(param);
  self.name = 'Carolingian';
  self.class = 'Carolingian';
  self.sex = 'm';
  self.military = true;
  self.rank = '♞ ';
  self.mounted = true;
  self.baseSpd = 6;
  self.spriteSize = tileSize*3;
  self.damage = 20;
}

Malvoisin = function(param){
  var self = Character(param);
  self.name = 'Malvoisin';
  self.class = 'Malvoisin';
  self.rank = '♜ ';
  self.spriteSize = tileSize*12;
  self.ranged = true;
  self.damage = 150;
}

Charlemagne = function(param){
  var self = Character(param);
  self.name = 'Charlemagne';
  self.class = 'Charlemagne';
  self.sex = 'm';
  self.rank = '♚ ';
  self.mounted = true;
  self.baseSpd = 6;
  self.spriteSize = tileSize*3;
  self.damage = 25;
}

CeltAxe = function(param){
  var self = Character(param);
  self.name = 'Celt';
  self.class = 'CeltAxe';
  self.sex = 'm';
  self.military = true;
  self.spriteSize = tileSize*1.5;
  self.damage = 10;
}

CeltSpear = function(param){
  var self = Character(param);
  self.name = 'Celt';
  self.class = 'CeltSpear';
  self.sex = 'm';
  self.military = true;
  self.spriteSize = tileSize*2;
  self.damage = 10;
}

Headhunter = function(param){
  var self = Character(param);
  self.name = 'Headhunter';
  self.class = 'Headhunter';
  self.sex = 'm';
  self.military = true;
  self.rank = '♞ ';
  self.baseSpd = 7;
  self.mounted = true;
  self.spriteSize = tileSize*2;
  self.torchBearer = true;
  self.damage = 20;
}

Druid = function(param){
  var self = Character(param);
  self.name = 'Druid';
  self.class = 'Druid';
  self.sex = 'm';
  self.rank = '♝ ';
  self.spriteSize = tileSize*1.5;
  self.cleric = true;
  self.baseSpd = 2;
  self.torchBearer = true;
}

ScoutShip = function(param){
  var self = Character(param);
  self.name = 'Scout Ship';
  self.class = 'ScoutShip';
  self.military = true;
  self.ranged = true;
  self.torchBearer = true;
  self.damage = 10;
}

Longship = function(param){
  var self = Character(param);
  self.name = 'Longship';
  self.class = 'Longship';
  self.military = true;
  self.ranged = true;
  self.torchBearer = true;
  self.damage = 10;
}


Morrigan = function(param){
  var self = Character(param);
  self.name = 'Morrigan';
  self.class = 'Morrigan';
  self.sex = 'f';
  self.rank = '♜ ';
  self.mounted = true;
  self.baseSpd = 6;
  self.spriteSize = tileSize*2;
  self.torchBearer = true;
  self.damage = 25;
}

Gwenllian = function(param){
  var self = Character(param);
  self.name = 'Queen Gwenllian';
  self.class = 'Gwenllian';
  self.sex = 'f';
  self.rank = '♛ ';
  self.torchBearer = true;
}

TeutonPike = function(param){
  var self = Character(param);
  self.name = 'Teuton';
  self.class = 'TeutonPike';
  self.sex = 'm';
  self.military = true;
  self.spriteSize = tileSize*2;
  self.damage = 15;
}

TeutonBow = function(param){
  var self = Character(param);
  self.name = 'Teuton';
  self.class = 'TeutonBow';
  self.sex = 'm';
  self.military = true;
  self.spriteSize = tileSize*1.5;
  self.ranged = true;
  self.damage = 10;
}

TeutonicKnight = function(param){
  var self = Character(param);
  self.name = 'Teutonic Knight';
  self.class = 'TeutonicKnight';
  self.sex = 'm';
  self.military = true;
  self.rank = '♞ ';
  self.mounted = true;
  self.baseSpd = 6;
  self.spriteSize = tileSize*3;
  self.damage = 25;
}

Prior = function(param){
  var self = Character(param);
  self.name = 'Prior';
  self.class = 'Prior';
  self.sex = 'm';
  self.cleric = true;
  self.baseSpd = 2;
  self.torchBearer = true;
}

Archbishop = function(param){
  var self = Character(param);
  self.name = 'Archbishop';
  self.class = 'Archbishop';
  self.sex = 'm';
  self.rank = '♝ ';
  self.spriteSize = tileSize*1.5;
  self.cleric = true;
  self.baseSpd = 3.5;
  self.torchBearer = true;s
}

Hochmeister = function(param){
  var self = Character(param);
  self.name = 'Hochmeister';
  self.class = 'Hochmeister';
  self.sex = 'm';
  self.rank = '♜ ';
  self.spriteSize = tileSize*1.5;
  self.baseSpd = 3;
  self.torchBearer = true;
  self.damage = 25;
}

Trapper = function(param){
  var self = Character(param);
  self.name = 'Trapper';
  self.class = 'Trapper';
  self.sex = 'm';
  self.spriteSize = tileSize*1.5;
  self.damage = 10;
  self.stealthed = true;
  self.stealthTimer = false;
  var super_update = self.update;
  self.update = function(){
    if(!self.stealthed){
      if(((self.z == 0 && (nightfall || self.innaWoods)) || self.z == -1 || self.z == -2) && !self.stealthTimer && !self.action){
        self.stealthTimer = true;
        setTimeout(function(){
          if(((self.z == 0 && (nightfall || self.innaWoods)) || self.z == -1 || self.z == -2) && !self.action){
            self.stealthed = true;
            self.stealthTimer = false;
          }
        },3000);
      }
    }
    super_update();
  }
}

Outlaw = function(param){
  var self = Character(param);
  self.name = 'Outlaw';
  self.class = 'Outlaw';
  self.sex = 'm';
  self.spriteSize = tileSize*1.5;
  self.ranged = true;
  self.torchBearer = true;
  self.damage = 5;
}

Poacher = function(param){
  var self = Character(param);
  self.name = 'Poacher';
  self.class = 'Poacher';
  self.sex = 'm';
  self.rank = '♞ ';
  self.mounted = true;
  self.baseSpd = 7;
  self.spriteSize = tileSize*2;
  self.ranged = true;
  self.torchBearer = true;
  self.damage = 10;
}

Cutthroat = function(param){
  var self = Character(param);
  self.name = 'Cutthroat';
  self.class = 'Cutthroat';
  self.sex = 'm';
  self.spriteSize = tileSize*1.5;
  self.damage = 10;
  self.stealthed = true;
  self.stealthTimer = false;
  var super_update = self.update;
  self.update = function(){
    if(!self.stealthed){
      if(((self.z == 0 && (nightfall || self.innaWoods)) || self.z == -1 || self.z == -2) && !self.stealthTimer && !self.action){
        self.stealthTimer = true;
        setTimeout(function(){
          if(((self.z == 0 && (nightfall || self.innaWoods)) || self.z == -1 || self.z == -2) && !self.action){
            self.stealthed = true;
            self.stealthTimer = false;
          }
        },3000);
      }
    }
    super_update();
  }
}

Strongman = function(param){
  var self = Character(param);
  self.name = 'Strongman';
  self.class = 'Strongman';
  self.sex = 'm';
  self.spriteSize = tileSize*2;
  self.baseSpd = 3.5;
  self.torchBearer = true;
  self.damage = 15;
}

Marauder = function(param){
  var self = Character(param);
  self.name = 'Marauder';
  self.class = 'Marauder';
  self.sex = 'm';
  self.rank = '♞ ';
  self.mounted = true;
  self.baseSpd = 6;
  self.spriteSize = tileSize*3;
  self.torchBearer = true;
  self.damage = 20;
}

Condottiere = function(param){
  var self = Character(param);
  self.name = 'Condottiere';
  self.class = 'Condottiere';
  self.sex = 'm';
  self.rank = '♜ ';
  self.mounted = true;
  self.baseSpd = 6.5;
  self.spriteSize = tileSize*2;
  self.ranged = true;
  self.torchBearer = true;
  self.damage = 25;
}

// ARROWS
Arrow = function(param){
  var self = Entity(param);
  self.angle = param.angle;
  self.spdX = Math.cos(param.angle/180*Math.PI) * 50;
  self.spdY = Math.sin(param.angle/180*Math.PI) * 50;
  self.parent = param.parent;
  self.innaWoods = Player.list[self.parent].innaWoods;
  self.zGrid = Player.list[self.parent].zGrid;

  self.timer = 0;
  self.toRemove = false;
  var super_update = self.update;
  self.update = function(){
    super_update();
    if(self.z == 0 && getLocTile(0,self.x,self.y) >= 1 && getLocTile(0,self.x,self.y) < 2){
      self.innaWoods = true;
    } else {
      self.innaWoods = false;
    }
    if(self.timer++ > 100){
      self.toRemove = true;
    }
    for(var i in self.zGrid){
      var zc = self.zGrid[i][0];
      var zr = self.zGrid[i][1];
      if(zc < 64 && zc > -1 && zr < 64 && zr > -1){
        for(var n in zones[zr][zc]){
          var p = Player.list[zones[zr][zc][n]];
          if(p){
            if(self.getDistance(p) < 32 && self.z == p.z && self.parent != p.id){
              Player.list[p.id].hp -= Player.list[self.parent].dmg - p.fortitude;
              Player.list[p.id].working = false;
              Player.list[p.id].chopping = false;
              Player.list[p.id].mining = false;
              Player.list[p.id].farming = false;
              Player.list[p.id].building = false;
              Player.list[p.id].fishing = false;
              Player.list[self.parent].stealthed = false;
              Player.list[self.parent].revealed = false;
              Player.list[p.id].combat.target = self.id;
              Player.list[p.id].action = 'combat';
              Player.list[p.id].stealthed = false;
              Player.list[p.id].revealed = false;
              // player death & respawn
              if(Player.list[p.id].hp <= 0){
                Player.list[p.id].die({id:self.parent,cause:'arrow'});
              }
              self.toRemove = true;
            }
          }
        }
      }
    }
    if(self.x == 0 || self.x == mapPx || self.y == 0 || self.y == mapPx){
      self.toRemove = true;
    } else if(self.z == 0 && getLocTile(0,self.x,self.y) == 5 &&
    getLocTile(0,Player.list[self.parent].x,Player.list[self.parent].y) != 5){
      self.toRemove = true;
    } else if(self.z == 0 && getLocTile(0,self.x,self.y) == 1 &&
    getLocTile(0,Player.list[self.parent].x,Player.list[self.parent].y) != 1){
      self.toRemove = true;
    } else if(self.z == 0 && (getLocTile(0,self.x,self.y) == 13 ||
    getLocTile(0,self.x,self.y) == 14 || getLocTile(0,self.x,self.y) == 15 ||
    getLocTile(0,self.x,self.y) == 16 || getLocTile(0,self.x,self.y) == 19)){
      self.toRemove = true;
    } else if(self.z == -1 && getLocTile(1,self.x,self.y) == 1){
      self.toRemove = true;
    } else if(self.z == -2 && getLocTile(8,self.x,self.y) == 0){
      self.toRemove = true;
    } else if(self.z == 1 &&
      (getLocTile(3,self.x,self.y) == 0 || getLocTile(4,self.x,self.y) != 0)){
      self.toRemove = true;
    } else if(self.z == 2 &&
      (getLocTile(5,self.x,self.y) == 0 || getLocTile(4,self.x,self.y) != 0)){
      self.toRemove = true;
    }
  }

  self.getInitPack = function(){
    return {
      id:self.id,
      angle:self.angle,
      x:self.x,
      y:self.y,
      z:self.z,
      innaWoods:self.innaWoods
    };
  };

  self.getUpdatePack = function(){
    return {
      id:self.id,
      x:self.x,
      y:self.y,
      z:self.z,
      innaWoods:self.innaWoods
    };
  };

  Arrow.list[self.id] = self;
  initPack.arrow.push(self.getInitPack());
  return self;
}

Arrow.list = {};

Arrow.update = function(){
  var pack = [];
  for(var i in Arrow.list){
    var arrow = Arrow.list[i];
    arrow.update();
    if(arrow.toRemove){
      delete Arrow.list[i];
      removePack.arrow.push(arrow.id);
    } else {
      pack.push(arrow.getUpdatePack());
    }
  }
  return pack;
}

Arrow.getAllInitPack = function(){
  var arrows = [];
  for(var i in Arrow.list)
    arrows.push(Arrow.list[i].getInitPack());
  return arrows;
}

// ITEM
Item = function(param){
  var self = Entity(param);
  self.x = param.x;
  self.y = param.y;
  self.z = param.z;
  self.qty = param.qty;
  self.type = null;
  self.class = null;
  self.rank = null; // 0 = common, 1 = rare, 2 = lore, 3 = mythic, 4 = relic
  self.parent = param.parent;
  self.canPickup = true;
  self.toUpdate = false;
  self.toRemove = false;
  if(self.z == 0 && getLocTile(0,self.x,self.y) >= 1 && getLocTile(0,self.x,self.y) < 2){
    self.innaWoods = true;
  } else {
    self.innaWoods = false;
  }

  self.blocker = function(n){
    var loc = getLoc(self.x,self.y);
    if(self.z == 0){
      matrixChange(0,loc[0],loc[1],n);
    } else if(self.z == 1){
      matrixChange(1,loc[0],loc[1],n);
    } else if(self.z == 2){
      matrixChange(2,loc[0],loc[1],n);
    } else if(self.z == -1){
      matrixChange(-1,loc[0],loc[1],n);
    } else if(self.z == -2){
      matrixChange(-2,loc[0],loc[1],n);
    } else if(self.z == -3){
      matrixChange(-3,loc[0],loc[1],n);
    }
  }

  self.getInitPack = function(){
    return {
      id:self.id,
      parent:self.parent,
      type:self.type,
      x:self.x,
      y:self.y,
      z:self.z,
      qty:self.qty,
      innaWoods:self.innaWoods
    };
  }

  self.getUpdatePack = function(){
    return{
      id:self.id,
      x:self.x,
      y:self.y,
      z:self.z,
      innaWoods:self.innaWoods
    }
  }
  return self;
}

Item.list = {};

Item.update = function(){
  var pack = [];
  for(var i in Item.list){
    var item = Item.list[i];
    if(item.toUpdate){
      item.update();
      if(item.toRemove){
        delete Item.list[i];
        removePack.item.push(item.id);
      } else {
        pack.push(item.getUpdatePack());
      }
    }
  }
  return pack;
}

Item.getAllInitPack = function(){
  var items = [];
  for(var i in Item.list)
    items.push(Item.list[i].getInitPack());
  return items;
}

// WOOD
Wood = function(param){
  var self = Item(param);
  self.type = 'Wood';
  self.class = 'resource';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.wood > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too much</i> <b>Wood</b>.'}));
    } else if(player.inventory.wood + self.qty > 10){
      var q = 10 - player.inventory.wood;
      self.qty -= q;
      Player.list[id].inventory.wood += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Wood</b>.'}));
    } else {
      Player.list[id].inventory.wood += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Wood</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// STONE
Stone = function(param){
  var self = Item(param);
  self.type = 'Stone';
  self.class = 'resource';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.stone > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too much</i> <b>Stone</b>.'}));
    } else if(player.inventory.stone + self.qty > 10){
      var q = 10 - player.inventory.stone;
      self.qty -= q;
      Player.list[id].inventory.stone += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Stone</b>.'}));
    } else {
      Player.list[id].inventory.stone += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Stone</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// GRAIN
Grain = function(param){
  var self = Item(param);
  self.type = 'Grain';
  self.class = 'resource';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    return;
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// IRON ORE
IronOre = function(param){
  var self = Item(param);
  self.type = 'IronOre';
  self.class = 'resource';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.ironore > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too much</i> <b>IronOre</b>.'}));
    } else if(player.inventory.ironore + self.qty > 10){
      var q = 10 - player.inventory.ironore;
      self.qty -= q;
      Player.list[id].inventory.ironore += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>IronOre</b>.'}));
    } else {
      Player.list[id].inventory.ironore += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>IronOre</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// IRON BAR
Iron = function(param){
  var self = Item(param);
  self.type = 'Iron';
  self.class = 'resource';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.iron > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too much</i> <b>Iron</b>.'}));
    } else if(player.inventory.iron + self.qty > 10){
      var q = 10 - player.inventory.iron;
      self.qty -= q;
      Player.list[id].inventory.iron += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Iron</b>.'}));
    } else {
      Player.list[id].inventory.iron += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Iron</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// STEEL BAR
Steel = function(param){
  var self = Item(param);
  self.type = 'Steel';
  self.class = 'resource';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.steel > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too much</i> <b>Steel</b>.'}));
    } else if(player.inventory.steel + self.qty > 10){
      var q = 10 - player.inventory.steel;
      self.qty -= q;
      Player.list[id].inventory.steel += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Steel</b>.'}));
    } else {
      Player.list[id].inventory.steel += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Steel</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// BOAR HIDE
BoarHide = function(param){
  var self = Item(param);
  self.type = 'BoarHide';
  self.class = 'resource';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.boarhide > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>BoarHide</b>.'}));
    } else if(player.inventory.boarhide + self.qty > 25){
      var q = 25 - player.inventory.boarhide;
      self.qty -= q;
      Player.list[id].inventory.boarhide += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>BoarHide</b>.'}));
    } else {
      Player.list[id].inventory.boarhide += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>BoarHide</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// LEATHER
Leather = function(param){
  var self = Item(param);
  self.type = 'Leather';
  self.class = 'resource';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.leather > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too much</i> <b>Leather</b>.'}));
    } else if(player.inventory.leather + self.qty > 25){
      var q = 25 - player.inventory.leather;
      self.qty -= q;
      Player.list[id].inventory.leather += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Leather</b>.'}));
    } else {
      Player.list[id].inventory.leather += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Leather</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// SILVER ORE
SilverOre = function(param){
  var self = Item(param);
  self.type = 'SilverOre';
  self.class = 'resource';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.silverore > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too much</i> <b>SilverOre</b>.'}));
    } else if(player.inventory.silverore + self.qty > 10){
      var q = 10 - player.inventory.silverore;
      self.qty -= q;
      Player.list[id].inventory.silverore += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>SilverOre</b>.'}));
    } else {
      Player.list[id].inventory.silverore += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>SilverOre</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// SILVER
Silver = function(param){
  var self = Item(param);
  self.type = 'Silver';
  self.class = 'resource';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    Player.list[id].inventory.silver += self.qty;
    socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Silver</b>.'}));
    self.toRemove = true;
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// GOLD ORE
GoldOre = function(param){
  var self = Item(param);
  self.type = 'Goldore';
  self.class = 'resource';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.goldore > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too much</i> <b>GoldOre</b>.'}));
    } else if(player.inventory.goldore + self.qty > 10){
      var q = 10 - player.inventory.goldore;
      self.qty -= q;
      Player.list[id].inventory.goldore += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>GoldOre</b>.'}));
    } else {
      Player.list[id].inventory.goldore += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>GoldOre</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// GOLD
Gold = function(param){
  var self = Item(param);
  self.type = 'Gold';
  self.class = 'resource';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    Player.list[id].inventory.gold += self.qty;
    socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Gold</b>.'}));
    self.toRemove = true;
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// DIAMOND
Diamond = function(param){
  var self = Item(param);
  self.type = 'Diamond';
  self.class = 'resource';
  self.rank = 2;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    Player.list[id].inventory.diamond += self.qty;
    socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Diamond</b>.'}));
    self.toRemove = true;
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// HUNTING KNIFE
HuntingKnife = function(param){
  var self = Item(param);
  self.type = 'HuntingKnife';
  self.class = 'dagger';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.huntingknife > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>HuntingKnife</b>.'}));
    } else if(player.inventory.huntingknife + self.qty > 10){
      var q = 10 - player.inventory.huntingknife;
      self.qty -= q;
      Player.list[id].inventory.huntingknife += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>HuntingKnife</b>.'}));
    } else {
      Player.list[id].inventory.huntingknife += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>HuntingKnife</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

Dague = function(param){
  var self = Item(param);
  self.type = 'Dague';
  self.class = 'dagger';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.dague > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Dague</b>.'}));
    } else if(player.inventory.dague + self.qty > 10){
      var q = 10 - player.inventory.dague;
      self.qty -= q;
      Player.list[id].inventory.dague += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Dague</b>.'}));
    } else {
      Player.list[id].inventory.dague += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Dague</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

Rondel = function(param){
  var self = Item(param);
  self.type = 'Rondel';
  self.class = 'dagger';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.rondel > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Rondel</b>.'}));
    } else if(player.inventory.rondel + self.qty > 10){
      var q = 10 - player.inventory.rondel;
      self.qty -= q;
      Player.list[id].inventory.rondel += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Rondel</b>.'}));
    } else {
      Player.list[id].inventory.rondel += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Rondel</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

Misericorde = function(param){
  var self = Item(param);
  self.type = 'Misericorde';
  self.class = 'dagger';
  self.rank = 2;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.misericorde > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Misericorde</b>.'}));
    } else if(player.inventory.misericorde + self.qty > 10){
      var q = 10 - player.inventory.misericorde;
      self.qty -= q;
      Player.list[id].inventory.misericorde += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Misericorde</b>.'}));
    } else {
      Player.list[id].inventory.misericorde += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Misericorde</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// BASTARD SWORD
BastardSword = function(param){
  var self = Item(param);
  self.type = 'BastardSword';
  self.class = 'sword';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.bastardsword > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>BastardSword</b>.'}));
    } else if(player.inventory.bastardsword + self.qty > 10){
      var q = 10 - player.inventory.bastardsword;
      self.qty -= q;
      Player.list[id].inventory.bastardsword += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>BastardSword</b>.'}));
    } else {
      Player.list[id].inventory. bastardsword += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>BastardSword</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// LONGSWORD
Longsword = function(param){
  var self = Item(param);
  self.type = 'Longsword';
  self.class = 'sword';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.longsword > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Longsword</b>.'}));
    } else if(player.inventory.longsword + self.qty > 10){
      var q = 10 - player.inventory.longsword;
      self.qty -= q;
      Player.list[id].inventory.longsword += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Longsword</b>.'}));
    } else {
      Player.list[id].inventory.longsword += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Longsword</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// ZWEIHANDER
Zweihander = function(param){
  var self = Item(param);
  self.type = 'Zweihander';
  self.class = 'sword';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.zweihander > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Zweihander</b>.'}));
    } else if(player.inventory.zweihander + self.qty > 10){
      var q = 10 - player.inventory.zweihander;
      self.qty -= q;
      Player.list[id].inventory.zweihander += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Zweihander</b>.'}));
    } else {
      Player.list[id].inventory.zweihander += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Zweihander</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// MORALLTA
Morallta = function(param){
  var self = Item(param);
  self.type = 'Morallta';
  self.class = 'sword';
  self.rank = 3;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.morallta > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Morallta</b>.'}));
    } else if(player.inventory.morallta + self.qty > 10){
      var q = 10 - player.inventory.morallta;
      self.qty -= q;
      Player.list[id].inventory.morallta += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Morallta</b>.'}));
    } else {
      Player.list[id].inventory.morallta += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Morallta</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// BOW
Bow = function(param){
  var self = Item(param);
  self.type = 'Bow';
  self.class = 'bow';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.bow > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Bow</b>.'}));
    } else if(player.inventory.bow + self.qty > 10){
      var q = 10 - player.inventory.bow;
      self.qty -= q;
      Player.list[id].inventory.bow += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Bow</b>.'}));
    } else {
      Player.list[id].inventory.bow += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Bow</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// WELSH LONGBOW
WelshLongbow = function(param){
  var self = Item(param);
  self.type = 'WelshLongbow';
  self.class = 'bow';
  self.rank = 2;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.welshlongbow > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>WelshLongbow</b>.'}));
    } else if(player.inventory.welshlongbow + self.qty > 10){
      var q = 10 - player.inventory.welshlongbow;
      self.qty -= q;
      Player.list[id].inventory.welshlongbow += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>WelshLongbow</b>.'}));
    } else {
      Player.list[id].inventory.welshlongbow += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>WelshLongbow</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// KNIGHT LANCE
KnightLance = function(param){
  var self = Item(param);
  self.type = 'KnightLance';
  self.class = 'lance';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.knightlance > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>KnightLance</b>.'}));
    } else if(player.inventory.knightlance + self.qty > 10){
      var q = 10 - player.inventory.knightlance;
      self.qty -= q;
      Player.list[id].inventory.knightlance += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>KnightLance</b>.'}));
    } else {
      Player.list[id].inventory.knightlance += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>KnightLance</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// RUSTIC LANCE
RusticLance = function(param){
  var self = Item(param);
  self.type = 'RusticLance';
  self.class = 'lance';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.rusticlance > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>RusticLance</b>.'}));
    } else if(player.inventory.rusticlance + self.qty > 10){
      var q = 10 - player.inventory.rusticlance;
      self.qty -= q;
      Player.list[id].inventory.rusticlance += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>RusticLance</b>.'}));
    } else {
      Player.list[id].inventory.rusticlance += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>RusticLance</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// PALADIN LANCE
PaladinLance = function(param){
  var self = Item(param);
  self.type = 'PaladinLance';
  self.class = 'lance';
  self.rank = 2;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.paladinlance > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>PaladinLance</b>.'}));
    } else if(player.inventory.paladinlance + self.qty > 10){
      var q = 10 - player.inventory.paladinlance;
      self.qty -= q;
      Player.list[id].inventory.paladinlance += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>PaladinLance</b>.'}));
    } else {
      Player.list[id].inventory.paladinlance += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>PaladinLance</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// BRIGANDINE
Brigandine = function(param){
  var self = Item(param);
  self.type = 'Brigandine';
  self.class = 'leather';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.brigandine > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Brigandine</b>.'}));
    } else if(player.inventory.brigandine + self.qty > 10){
      var q = 10 - player.inventory.brigandine;
      self.qty -= q;
      Player.list[id].inventory.brigandine += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Brigandine</b>.'}));
    } else {
      Player.list[id].inventory.brigandine += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Brigandine</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// LAMELLAR
Lamellar = function(param){
  var self = Item(param);
  self.type = 'Lamellar';
  self.class = 'leather';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.lamellar > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Lamellar</b>.'}));
    } else if(player.inventory.lamellar + self.qty > 10){
      var q = 10 - player.inventory.lamellar;
      self.qty -= q;
      Player.list[id].inventory.lamellar += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Lamellar</b>.'}));
    } else {
      Player.list[id].inventory.lamellar += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Lamellar</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// IRON MAIL
Maille = function(param){
  var self = Item(param);
  self.type = 'Maille';
  self.class = 'chainmail';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.maille > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Maille</b>.'}));
    } else if(player.inventory.maille + self.qty > 10){
      var q = 10 - player.inventory.maille;
      self.qty -= q;
      Player.list[id].inventory.maille += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Maille</b>.'}));
    } else {
      Player.list[id].inventory.maille += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Maille</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// STEEL MAIL
Hauberk = function(param){
  var self = Item(param);
  self.type = 'Hauberk';
  self.class = 'chainmail';
  self.rank = 0;
  self.canPickup = true;
  Item.list[self.id] = self;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.hauberk > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Hauberk</b>.'}));
    } else if(player.inventory.hauberk + self.qty > 10){
      var q = 10 - player.inventory.hauberk;
      self.qty -= q;
      Player.list[id].inventory.hauberk += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Hauberk</b>.'}));
    } else {
      Player.list[id].inventory.hauberk += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Hauberk</b>.'}));
      self.toRemove = true;
    }
  }
  initPack.item.push(self.getInitPack());
  return self;
}

// BRYNJA
Brynja = function(param){
  var self = Item(param);
  self.type = 'Brynja';
  self.class = 'chainmail';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.brynja > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Brynja</b>.'}));
    } else if(player.inventory.brynja + self.qty > 10){
      var q = 10 - player.inventory.brynja;
      self.qty -= q;
      Player.list[id].inventory.brynja += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Brynja</b>.'}));
    } else {
      Player.list[id].inventory.brynja += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Brynja</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// CUIRASS
Cuirass = function(param){
  var self = Item(param);
  self.type = 'Cuirass';
  self.class = 'plate';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.cuirass > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Cuirass</b>.'}));
    } else if(player.inventory.cuirass + self.qty > 10){
      var q = 10 - player.inventory.cuirass;
      self.qty -= q;
      Player.list[id].inventory.cuirass += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Cuirass</b>.'}));
    } else {
      Player.list[id].inventory.cuirass += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Cuirass</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// STEEL PLATE
SteelPlate = function(param){
  var self = Item(param);
  self.type = 'SteelPlate';
  self.class = 'plate';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.steelplate > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>SteelPlate</b>.'}));
    } else if(player.inventory.steelplate + self.qty > 10){
      var q = 10 - player.inventory.steelplate;
      self.qty -= q;
      Player.list[id].inventory.steelplate += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>SteelPlate</b>.'}));
    } else {
      Player.list[id].inventory.steelplate += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>SteelPlate</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// GREENWICH PLATE
GreenwichPlate = function(param){
  var self = Item(param);
  self.type = 'GreenwichPlate';
  self.class = 'plate';
  self.rank = 2;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.greenwichplate > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>GreenwichPlate</b>.'}));
    } else if(player.inventory.greenwichplate + self.qty > 10){
      var q = 10 - player.inventory.greenwichplate;
      self.qty -= q;
      Player.list[id].inventory.greenwichplate += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>GreenwichPlate</b>.'}));
    } else {
      Player.list[id].inventory.greenwichplate += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>GreenwichPlate</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// GOTHIC PLATE
GothicPlate = function(param){
  var self = Item(param);
  self.type = 'GothicPlate';
  self.class = 'plate';
  self.rank = 3;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.gothicplate > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>GothicPlate</b>.'}));
    } else if(player.inventory.gothicplate + self.qty > 10){
      var q = 10 - player.inventory.gothicplate;
      self.qty -= q;
      Player.list[id].inventory.gothicplate += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>GothicPlate</b>.'}));
    } else {
      Player.list[id].inventory.gothicplate += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>GothicPlate</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// CLERIC ROBE
ClericRobe = function(param){
  var self = Item(param);
  self.type = 'ClericRobe';
  self.class = 'cloth';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.clericrobe > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>ClericRobe</b>.'}));
    } else if(player.inventory.clericrobe + self.qty > 10){
      var q = 10 - player.inventory.clericrobe;
      self.qty -= q;
      Player.list[id].inventory.clericrobe += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>ClericRobe</b>.'}));
    } else {
      Player.list[id].inventory.clericrobe += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>ClericRobe</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// MONK COWL
MonkCowl = function(param){
  var self = Item(param);
  self.type = 'MonkCowl';
  self.class = 'cloth';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.monkcowl > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>MonkCowl</b>.'}));
    } else if(player.inventory.monkcowl + self.qty > 10){
      var q = 10 - player.inventory.monkcowl;
      self.qty -= q;
      Player.list[id].inventory.monkcowl += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>MonkCowl</b>.'}));
    } else {
      Player.list[id].inventory.monkcowl += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>MonkCowl</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// BLACK CLOAK
BlackCloak = function(param){
  var self = Item(param);
  self.type = 'BlackCloak';
  self.class = 'cloth';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.blackcloak > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>BlackCloak</b>.'}));
    } else if(player.inventory.blackcloak + self.qty > 10){
      var q = 10 - player.inventory.blackcloak;
      self.qty -= q;
      Player.list[id].inventory.blackcloak += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>BlackCloak</b>.'}));
    } else {
      Player.list[id].inventory.blackcloak += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>BlackCloak</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// TOME
Tome = function(param){
  var self = Item(param);
  self.type = 'Tome';
  self.class = 'text';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.tome > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Tome</b>.'}));
    } else if(player.inventory.tome + self.qty > 10){
      var q = 10 - player.inventory.tome;
      self.qty -= q;
      Player.list[id].inventory.tome += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Tome</b>.'}));
    } else {
      Player.list[id].inventory.tome += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Tome</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// RUNIC SCROLL
RunicScroll = function(param){
  var self = Item(param);
  self.type = 'RunicScroll';
  self.class = 'text';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.runicscroll > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>RunicScroll</b>.'}));
    } else if(player.inventory.runicscroll + self.qty > 10){
      var q = 10 - player.inventory.runicscroll;
      self.qty -= q;
      Player.list[id].inventory.runicscroll += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>RunicScroll</b>.'}));
    } else {
      Player.list[id].inventory.runicscroll += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>RunicScroll</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// SACRED TEXT
SacredText = function(param){
  var self = Item(param);
  self.type = 'SacredText';
  self.class = 'text';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.sacredtext > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>SacredText</b>.'}));
    } else if(player.inventory.sacredtext + self.qty > 10){
      var q = 10 - player.inventory.sacredtext;
      self.qty -= q;
      Player.list[id].inventory.sacredtext += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>SacredText</b>.'}));
    } else {
      Player.list[id].inventory.sacredtext += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>SacredText</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// STONE AXE
StoneAxe = function(param){
  var self = Item(param);
  self.type = 'StoneAxe';
  self.class = 'tool';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.stoneaxe > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>StoneAxe</b>.'}));
    } else if(player.inventory.stoneaxe + self.qty > 10){
      var q = 10 - player.inventory.stoneaxe;
      self.qty -= q;
      Player.list[id].inventory.stoneaxe += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>StoneAxe</b>.'}));
    } else {
      Player.list[id].inventory.stoneaxe += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>StoneAxe</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// IRON AXE
IronAxe = function(param){
  var self = Item(param);
  self.type = 'IronAxe';
  self.class = 'tool';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.ironaxe > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>IronAxe</b>.'}));
    } else if(player.inventory.ironaxe + self.qty > 10){
      var q = 10 - player.inventory.ironaxe;
      self.qty -= q;
      Player.list[id].inventory.ironaxe += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>IronAxe</b>.'}));
    } else {
      Player.list[id].inventory.ironaxe += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>IronAxe</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// PICKAXE
Pickaxe = function(param){
  var self = Item(param);
  self.type = 'Pickaxe';
  self.class = 'tool';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.pickaxe > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>PickAxe</b>.'}));
    } else if(player.inventory.pickaxe + self.qty > 10){
      var q = 10 - player.inventory.pickaxe;
      self.qty -= q;
      Player.list[id].inventory.pickaxe += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Pickaxe</b>.'}));
    } else {
      Player.list[id].inventory.pickaxe += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Pickaxe</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// KEY
Key = function(param){
  var self = Item(param);
  self.type = 'Key';
  self.name = param.name;
  self.class = 'tool';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up a </i><b>Key</b>.'}));
    Player.list[id].inventory.key++;
    Player.list[id].inventory.keyRing.push({id:self.id,name:self.name});
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// TORCH
Torch = function(param){
  var self = Item(param);
  self.type = 'Torch';
  self.class = 'tool';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.torch > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Torch</b>.'}));
    } else if(player.inventory.torch + self.qty > 25){
      var q = 25 - player.inventory.torch;
      self.qty -= q;
      Player.list[id].inventory.torch += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Torch</b>.'}));
    } else {
      Player.list[id].inventory.torch += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Torch</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// LIT TORCH
LitTorch = function(param){
  var self = Item(param);
  self.type = 'LitTorch';
  self.rank = 0;
  self.canPickup = false;
  self.timer = 0;
  self.toUpdate = true;
  var super_update = self.update;
  self.update = function(){
    if(Player.list[self.parent]){
      self.x = Player.list[self.parent].x - (tileSize * 0.75);
      self.y = Player.list[self.parent].y - (tileSize * 0.75);
      self.z = Player.list[self.parent].z;
      self.innaWoods = Player.list[self.parent].innaWoods;
    } else {
      self.toRemove = true;
    }
    if(self.timer++ > 3000){
      self.toRemove = true;
      Player.list[self.parent].hasTorch = false;
    }
    if(self.z == -3){
      self.toRemove = true;
      Player.list[self.parent].hasTorch = false;
    }
    super_update();
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  Light({
    parent:self.id,
    radius:1,
    x:self.x,
    y:self.y,
    z:self.z
  });
  return self;
}

// WALL TORCH
WallTorch = function(param){
  var self = Item(param);
  self.type = 'WallTorch';
  self.class = 'tool';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  Light({
    parent:self.id,
    radius:1,
    x:self.x + (tileSize/2),
    y:self.y,
    z:self.z
  });
  return self;
}

//CAMPFIRE
Campfire = function(param){
  var self = Item(param);
  self.type = 'Campfire';
  self.class = 'tool';
  self.rank = 0;
  self.canPickup = false;
  self.timer = 0;
  self.toUpdate = true;
  var super_update = self.update;
  self.update = function(){
    self.timer++;
    if(self.timer > 8000){
      self.toRemove = true;
    }
    super_update();
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  Light({
    parent:self.id,
    radius:1.2,
    x:self.x + (tileSize/2),
    y:self.y + (tileSize/2),
    z:self.z
  });
  return self;
}

//CAMPFIRE
InfiniteFire = function(param){
  var self = Item(param);
  self.type = 'Campfire';
  self.class = 'tool';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  Light({
    parent:self.id,
    radius:1.2,
    x:self.x + (tileSize/2),
    y:self.y + (tileSize/2),
    z:self.z
  });
  return self;
}

// FIREPIT
Firepit = function(param){
  var self = Item(param);
  self.type = 'Firepit';
  self.class = 'tool';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  Light({
    parent:self.id,
    radius:1.2,
    x:self.x + (tileSize/2),
    y:self.y + (tileSize/2),
    z:self.z
  });
  self.blocker(1);
  return self;
}

// FIREPLACE
Fireplace = function(param){
  var self = Item(param);
  self.type = 'Fireplace';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  Light({
    parent:self.id,
    radius:1.01,
    x:self.x + (tileSize/2),
    y:self.y + (tileSize/1.5),
    z:self.z
  });
  return self;
}

// FURNACE
Furnace = function(param){
  var self = Item(param);
  self.type = 'Furnace';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  Light({
    parent:self.id,
    radius:1.01,
    x:self.x + (tileSize/2),
    y:self.y + (tileSize * 0.75),
    z:self.z
  });
  self.blocker(self.type);
  return self;
}

// BARREL
Barrel = function(param){
  var self = Item(param);
  self.type = 'Barrel';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(self.type);
  return self;
}

// CRATES
Crates = function(param){
  var self = Item(param);
  self.type = 'Crates';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(self.type);
  return self;
}

// BOOKSHELF
Bookshelf = function(param){
  var self = Item(param);
  self.type = 'Bookshelf';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(self.type);
  return self;
}

// SUIT OF ARMOR
SuitArmor = function(param){
  var self = Item(param);
  self.type = 'SuitArmor';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// ANVIL
Anvil = function(param){
  var self = Item(param);
  self.type = 'Anvil';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(self.type);
  return self;
}

// RUNESTONE
Runestone = function(param){
  var self = Item(param);
  self.type = 'Runestone';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(1);
  return self;
}

// DUMMY
Dummy = function(param){
  var self = Item(param);
  self.type = 'Dummy';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(self.type);
  return self;
}

// CROSS
Cross = function(param){
  var self = Item(param);
  self.type = 'Cross';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// SKELETON1
Skeleton1 = function(param){
  var self = Item(param);
  self.type = 'Skeleton1';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// SKELETON2
Skeleton2 = function(param){
  var self = Item(param);
  self.type = 'Skeleton2';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// GOODS1
Goods1 = function(param){
  var self = Item(param);
  self.type = 'Goods1';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(self.type);
  return self;
}

// GOODS2
Goods2 = function(param){
  var self = Item(param);
  self.type = 'Goods2';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(self.type);
  return self;
}

// GOODS3
Goods3 = function(param){
  var self = Item(param);
  self.type = 'Goods3';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(self.type);
  return self;
}

// GOODS4
Goods4 = function(param){
  var self = Item(param);
  self.type = 'Goods4';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(self.type);
  return self;
}

// STASH1
Stash1 = function(param){
  var self = Item(param);
  self.type = 'Stash1';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(1);
  return self;
}

// STASH2
Stash2 = function(param){
  var self = Item(param);
  self.type = 'Stash2';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(1);
  return self;
}

// DESK
Desk = function(param){
  var self = Item(param);
  self.type = 'Desk';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(self.type);
  return self;
}

// SWORDRACK
Swordrack = function(param){
  var self = Item(param);
  self.type = 'Swordrack';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// BED
Bed = function(param){
  var self = Item(param);
  self.type = 'Bed';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// JAIL
Jail = function(param){
  var self = Item(param);
  self.type = 'Jail';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(1);
  return self;
}

// JAIL
JailDoor = function(param){
  var self = Item(param);
  self.type = 'JailDoor';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(self.type);
  return self;
}

// CHAINS
Chains = function(param){
  var self = Item(param);
  self.type = 'Chains';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// THRONE
Throne = function(param){
  var self = Item(param);
  self.type = 'Throne';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// BANNER
Banner = function(param){
  var self = Item(param);
  self.type = 'Banner';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// STAG HEAD
StagHead = function(param){
  var self = Item(param);
  self.type = 'StagHead';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// BLOOD
Blood = function(param){
  var self = Item(param);
  self.type = 'Blood';
  self.class = 'environment';
  self.rank = 0;
  self.canPickup = false;
  self.toUpdate = true;
  var super_update = self.update;
  self.update = function(){
    if(self.timer++ > 16000){
      self.toRemove = true;
    }
    super_update();
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// CHEST
Chest = function(param){
  var self = Item(param);
  self.type = 'Chest';
  self.class = 'tool';
  self.rank = 0;
  self.canPickup = false;
  self.inventory = Inventory();
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(self.type);
  return self;
}

// LOCKED CHEST
LockedChest = function(param){
  var self = Item(param);
  self.type = 'LockedChest';
  self.class = 'tool';
  self.rank = 0;
  self.canPickup = false;
  self.inventory = Inventory();
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  self.blocker(self.type);
  return self;
}

// BREAD
Bread = function(param){
  var self = Item(param);
  self.type = 'Bread';
  self.class = 'consumable';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.bread > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too much</i> <b>Bread</b>.'}));
    } else if(player.inventory.bread + self.qty > 25){
      var q = 25 - player.inventory.bread;
      self.qty -= q;
      Player.list[id].inventory.bread += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Bread</b>.'}));
    } else {
      Player.list[id].inventory.bread += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Bread</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// FISH
Fish = function(param){
  var self = Item(param);
  self.type = 'Fish';
  self.class = 'consumable';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.fish > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Fish</b>.'}));
    } else if(player.inventory.fish + self.qty > 25){
      var q = 25 - player.inventory.fish;
      self.qty -= q;
      Player.list[id].inventory.fish += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Fish</b>.'}));
    } else {
      Player.list[id].inventory.fish += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Fish</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// LAMB
Lamb = function(param){
  var self = Item(param);
  self.type = 'Lamb';
  self.class = 'resource';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.lamb > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too much</i> <b>Lamb</b>.'}));
    } else if(player.inventory.lamb + self.qty > 25){
      var q = 25 - player.inventory.lamb;
      self.qty -= q;
      Player.list[id].inventory.lamb += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Lamb</b>.'}));
    } else {
      Player.list[id].inventory.lamb += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Lamb</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// BOAR MEAT
BoarMeat = function(param){
  var self = Item(param);
  self.type = 'BoarMeat';
  self.class = 'resource';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.boarmeat > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too much</i> <b>BoarMeat</b>.'}));
    } else if(player.inventory.boarmeat + self.qty > 25){
      var q = 25 - player.inventory.boarmeat;
      self.qty -= q;
      Player.list[id].inventory.boarmeat += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>BoarMeat</b>.'}));
    } else {
      Player.list[id].inventory.boarmeat += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>BoarMeat</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// VENISON
Venison = function(param){
  var self = Item(param);
  self.type = 'Venison';
  self.class = 'resource';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.venison > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too much</i> <b>Venison</b>.'}));
    } else if(player.inventory.venison + self.qty > 25){
      var q = 25 - player.inventory.venison;
      self.qty -= q;
      Player.list[id].inventory.venison += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Venison</b>.'}));
    } else {
      Player.list[id].inventory.venison += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Venison</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// POACHED FISH
PoachedFish = function(param){
  var self = Item(param);
  self.type = 'PoachedFish';
  self.class = 'consumable';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.poachedfish > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>PoachedFish</b>.'}));
    } else if(player.inventory.poachedfish + self.qty > 25){
      var q = 25 - player.inventory.poachedfish;
      self.qty -= q;
      Player.list[id].inventory.poachedfish += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>PoachedFish</b>.'}));
    } else {
      Player.list[id].inventory.poachedfish += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>PoachedFish</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// LAMB CHOP
LambChop = function(param){
  var self = Item(param);
  self.type = 'LambChop';
  self.class = 'consumable';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.lambchop > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>LambChop</b>.'}));
    } else if(player.inventory.lambchop + self.qty > 25){
      var q = 25 - player.inventory.lambchop;
      self.qty -= q;
      Player.list[id].inventory.lambchop += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>LambChop</b>.'}));
    } else {
      Player.list[id].inventory.lambchop += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>LambChop</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// BOAR SHANK
BoarShank = function(param){
  var self = Item(param);
  self.type = 'BoarShank';
  self.class = 'consumable';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.boarshank > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>BoarShank</b>.'}));
    } else if(player.inventory.boarshank + self.qty > 25){
      var q = 25 - player.inventory.boarshank;
      self.qty -= q;
      Player.list[id].inventory.boarshank += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>BoarShank</b>.'}));
    } else {
      Player.list[id].inventory.boarshank += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>BoarShank</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// VENISON LOIN
VenisonLoin = function(param){
  var self = Item(param);
  self.type = 'VenisonLoin';
  self.class = 'consumable';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.venisonloin > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>VenisonLoin</b>.'}));
    } else if(player.inventory.venisonloin + self.qty > 25){
      var q = 25 - player.inventory.venisonloin;
      self.qty -= q;
      Player.list[id].inventory.venisonloin += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>VenisonLoin</b>.'}));
    } else {
      Player.list[id].inventory.venisonloin += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>VenisonLoin</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// MEAD
Mead = function(param){
  var self = Item(param);
  self.type = 'Mead';
  self.class = 'consumable';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.mead > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too much</i> <b>Mead</b>.'}));
    } else if(player.inventory.mead + self.qty > 25){
      var q = 25 - player.inventory.mead;
      self.qty -= q;
      Player.list[id].inventory.mead += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Mead</b>.'}));
    } else {
      Player.list[id].inventory.mead += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Mead</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// SAISON
Saison = function(param){
  var self = Item(param);
  self.type = 'Saison';
  self.class = 'consumable';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.saison > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Saison</b>.'}));
    } else if(player.inventory.saison + self.qty > 25){
      var q = 25 - player.inventory.saison;
      self.qty -= q;
      Player.list[id].inventory.saison += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Saison</b>.'}));
    } else {
      Player.list[id].inventory.saison += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Saison</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// FLANDERS
Flanders = function(param){
  var self = Item(param);
  self.type = 'Flanders';
  self.class = 'consumable';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.flanders > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Flanders</b>.'}));
    } else if(player.inventory.flanders + self.qty > 25){
      var q = 25 - player.inventory.flanders;
      self.qty -= q;
      Player.list[id].inventory.flanders += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Flanders</b>.'}));
    } else {
      Player.list[id].inventory.flanders += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Flanders</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// BIERE DE GARDE
BiereDeGarde = function(param){
  var self = Item(param);
  self.type = 'BiereDeGarde';
  self.class = 'consumable';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.bieredegarde > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>BiereDeGarde</b>.'}));
    } else if(player.inventory.bieredegarde + self.qty > 25){
      var q = 25 - player.inventory.bieredegarde;
      self.qty -= q;
      Player.list[id].inventory.bieredegarde += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>BiereDeGarde</b>.'}));
    } else {
      Player.list[id].inventory.bieredegarde += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>BiereDeGarde</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// BORDEAUX
Bordeaux = function(param){
  var self = Item(param);
  self.type = 'Bordeaux';
  self.class = 'consumable';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.bordeaux > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Bordeaux</b>.'}));
    } else if(player.inventory.bordeaux + self.qty > 25){
      var q = 25 - player.inventory.bordeaux;
      self.qty -= q;
      Player.list[id].inventory.bordeaux += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Bordeaux</b>.'}));
    } else {
      Player.list[id].inventory.bordeaux += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Bordeaux</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// BOURGOGNE
Bourgogne = function(param){
  var self = Item(param);
  self.type = 'Bourgogne';
  self.class = 'consumable';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.bourgogne > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Bourgogne</b>.'}));
    } else if(player.inventory.bourgogne + self.qty > 25){
      var q = 25 - player.inventory.bourgogne;
      self.qty -= q;
      Player.list[id].inventory.bourgogne += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Bourgogne</b>.'}));
    } else {
      Player.list[id].inventory.bourgogne += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Bourgogne</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// CHIANTI
Chianti = function(param){
  var self = Item(param);
  self.type = 'Chianti';
  self.class = 'consumable';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.chianti > 24){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Chianti</b>.'}));
    } else if(player.inventory.chianti + self.qty > 25){
      var q = 25 - player.inventory.chianti;
      self.qty -= q;
      Player.list[id].inventory.chianti += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Chianti</b>.'}));
    } else {
      Player.list[id].inventory.chianti += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Chianti</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// CROWN
Crown = function(param){
  var self = Item(param);
  self.type = 'Crown';
  self.class = 'head';
  self.rank = 3;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.crown > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Crown</b>.'}));
    } else if(player.inventory.crown + self.qty > 10){
      var q = 10 - player.inventory.crown;
      self.qty -= q;
      Player.list[id].inventory.crown += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Crown</b>.'}));
    } else {
      Player.list[id].inventory.crown += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Crown</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// ARROWS
Arrows = function(param){
  var self = Item(param);
  self.type = 'Arrows';
  self.class = 'tool';
  self.rank = 0;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.arrows > 49){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>Arrows</b>.'}));
    } else if(player.inventory.arrows + self.qty > 50){
      var q = 50 - player.inventory.arrows;
      self.qty -= q;
      Player.list[id].inventory.arrows += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>Arrows</b>.'}));
    } else {
      Player.list[id].inventory.arrows += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>Arrows</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// MAP
WorldMap = function(param){
  var self = Item(param);
  self.type = 'WorldMap';
  self.class = 'tool';
  self.rank = 1;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.worldmap > 9){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying too many</i> <b>WorldMap</b>.'}));
    } else if(player.inventory.worldmap + self.qty > 10){
      var q = 10 - player.inventory.worldmap;
      self.qty -= q;
      Player.list[id].inventory.worldmap += q;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + q + ' <b>WorldMap</b>.'}));
    } else {
      Player.list[id].inventory.worldmap += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up</i> ' + self.qty + ' <b>WorldMap</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// RELIC
Relic = function(param){
  var self = Item(param);
  self.type = 'Relic';
  self.class = 'relic';
  self.rank = 4;
  self.canPickup = true;
  self.pickup = function(id){
    var player = Player.list[id];
    var socket = SOCKET_LIST[id];
    if(player.inventory.relic > 0){
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You are already carrying a</i> <b>Relic</b>.'}));
    } else {
      Player.list[id].inventory.relic += self.qty;
      socket.write(JSON.stringify({msg:'addToChat',message:'<i>You picked up the</i> <b>Relic</b>.'}));
      self.toRemove = true;
    }
  }
  Item.list[self.id] = self;
  initPack.item.push(self.getInitPack());
  return self;
}

// LIGHT SOURCE
Light = function(param){
  var self = Entity(param);
  self.parent = param.parent;
  self.radius = param.radius;
  self.toRemove = false;
  self.toUpdate = false;
  var super_update = self.update;
  if(Item.list[self.parent].type == 'LitTorch'){
    self.toUpdate = true;
    self.update = function(){
      if(Item.list[self.parent]){
        self.x = Item.list[self.parent].x + (tileSize * 0.25);
        self.y = Item.list[self.parent].y;
        self.z = Item.list[self.parent].z;
      } else {
        self.toRemove = true;
      }
      super_update();
    }
  } else {
    if(Item.list[self.parent].type == 'Campfire'){
      self.toUpdate = true;
    }
    self.update = function(){
      if(!Item.list[self.parent]){
        self.toRemove = true;
      }
      super_update();
    }
  }

  self.getInitPack = function(){
    return {
      id:self.id,
      x:self.x,
      y:self.y,
      z:self.z,
      radius:self.radius
    };
  }

  self.getUpdatePack = function(){
    return {
      id:self.id,
      x:self.x,
      y:self.y,
      z:self.z
    }
  }

  Light.list[self.id] = self;
  initPack.light.push(self.getInitPack());
  return self;
}

Light.list = {};

Light.update = function(){
  var pack = [];
  for(var i in Light.list){
    var light = Light.list[i];
    if(light.toUpdate){
      light.update();
      if(light.toRemove){
        delete Light.list[i];
        removePack.light.push(light.id);
      } else {
        pack.push(light.getUpdatePack());
      }
    }
  }
  return pack;
}

Light.getAllInitPack = function(){
  var lights = [];
  for(var i in Light.list)
    lights.push(Light.list[i].getInitPack());
  return lights;
}
