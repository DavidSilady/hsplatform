// Edit to server by David Silady

// Housenka (Nibbles Revival)
// implementoval na Vanoce 2007 Milan Sorm
// original implementation by Milan Sorm from https://is.stuba.sk/js/herna/housenka.js
{
    var papejMsg = '';
    var startGameMsg = '';
    var point5Msg = '';
    var klic5Msg = '';
    var bludisteMsg = '';
    var live5Msg = '';
    var live1Msg = '';
    var live24Msg = '';
    var wallFailMsg = '';
    var point1Msg = '';
    var point24Msg = '';
    var keyAppearMsg = '';
    var klic1Msg = '';
    var klic5Msg = '';
    var klic24Msg = '';
    var keyGotMsg = '';
    var waitMsg = '';
    var pauseMsg = '';
    var nextLevelMsg = '';
    var wormFailMsg = '';
    var doorMsg = '';
    var ajaxErrorMsg = '';
    var accelMsg = '';
}

class GameState {
    constructor() {
        this.xsize = 41;
        this.ysize = 31;
        this.rychlost = 250;
        this.zradlo_pocatek = 10;
        this.zradlo_za_klic = 1;
        this.klicu_v_levelu = 1;
        this.cena_klice = 1;
        this.bodu_za_zradlo_orig = 1;
        this.bodu_za_klic = 10;
        this.bodu_za_level = 100;
        this.navysit_zradlo_za_klic = 1;		// prirustek kazdy level
        this.zrychleni = 0.8;
        this.levels = 24;
        this.lives = 3;

        this.level = 1;
        this.bodu_za_zradlo = this.bodu_za_zradlo_orig;
        this.plocha = Array(this.xsize * this.ysize).fill(0);
        this.povolena_zmena_smeru = 1;
        this.body = 0;
        this.obsahy = new Array ('prazdne','telicko','zradlo','zed','klic','dvere','hlavicka');
        this.zradla_k_dispozici = 0;
        this.telicko = new Array();
        this.klavesy = new Array();
        this.smer = 0;		// 0 vpravo, pak po smeru
        this.hlaska = "";
        this.klicu = 0;
        this.ulozeno_na_klice = 0;
        this.klic_na_scene = false;
        this.dvere_na_scene = false;
        this.startuj_hru = 1;
        this.body_na_zacatku_levelu = 0;
        this.ridkost = false;
        this.housenkaIterator = 0;

        this.smery = new Array (1,0,0,1,-1,0,0,-1);
        this.idx_smeru = new Array (0,2,4,6);
    }
}

class ServerGame {
    constructor(id, gameState, user) {
        this.user = {};
        if (user) {
            this.user = user;
        } else {
            this.user = {
                name: 'N/A',
                maxScore: 0,
                maxLevel: 0
            }
        }
        this.timer = {};
        if (gameState) {
            this.gameState = gameState;
        } else {
            this.gameState = new GameState();
        }

        this.novaHra();
    }
    zastavHru (reason) {
        this.zastavHousenku();
        this.show_result(waitMsg);
        this.callFinish(this.gameState.body,reason);
    }
    onKeyPress (keyDown) {
        //right down left up
        //nastav_smer = [[39, 76, 68], [40, 75, 83], [37, 74, 65], [38, 73, 87]]; // added new keys
        this.gameState.nastav_smer = [["KeyD"], ["KeyS"], ["KeyA"], ["KeyW"]]; // added new keys

        if (this.gameState.startuj_hru) {
            this.rozpohybujHousenku();
            this.gameState.startuj_hru = 0;
            this.show_result(this.gameState.hlaska);
        }

        let obslouzena = false;
        for (let key_group_index in this.gameState.nastav_smer) {
            this.gameState.nastav_smer[key_group_index].forEach(key => {
                if (key === keyDown) {
                    if (this.gameState.smer % 2 !== key_group_index % 2 && this.gameState.povolena_zmena_smeru) {
                        this.gameState.smer = key_group_index;
                        this.gameState.povolena_zmena_smeru = 0;
                    }
                    obslouzena = true;
                }})
        }

        if (keyDown === "Escape") {  // esc
            obslouzena = true;
            this.zastavHru('user');
        } else if (keyDown === "KeyP") { // P
            obslouzena = true;
            this.zastavHousenku();
            this.gameState.startuj_hru = 1;
        }

        return !obslouzena;
    }
    dalsiLevel () {
        ++this.gameState.level;
        this.gameState.body += this.gameState.level*this.gameState.bodu_za_level;
        this.gameState.body_na_zacatku_levelu = this.gameState.body;

        this.gameState.zradlo_za_klic += this.gameState.navysit_zradlo_za_klic;

        this.gameState.hlaska = nextLevelMsg;
        this.novaHra();
        this.show_result(this.gameState.hlaska);

        this.gameState.startuj_hru = 1;
    }
    novaHra () {
        this.zastavHousenku();
        this.vymazHousenku();
        this.vymazPlochu();

        this.gameState.klicu = 0;
        this.gameState.bodu_za_zradlo = this.gameState.bodu_za_zradlo_orig;
        this.gameState.ulozeno_na_klice = 0;
        this.gameState.klic_na_scene = false;
        this.gameState.dvere_na_scene = false;

        var informace = this.vygenerujLevel();

        this.gameState.smer = informace[0];
        var x = informace[1];
        var y = informace[2];

        var kam = (this.gameState.smer + 2) % this.gameState.idx_smeru.length;
        var p = Number(this.gameState.idx_smeru[kam]);
        var prdylka_x = x + this.gameState.smery[p];
        var prdylka_y = y + this.gameState.smery[p+1];

        this.narustHousenky(this.coords(prdylka_x,prdylka_y),false);
        this.narustHousenky(this.coords(x,y),true);

        this.show_body();
        this.show_klice();
        this.show_uroven();
        this.show_zivoty();

        this.doplnZradlo(this.gameState.zradlo_pocatek,-1);
    }
    show_body() {};
    show_klice() {};
    show_uroven() {};
    show_zivoty() {};
    rozpohybujHousenku () {
        if (this.timer)
            this.zastavHousenku();
        const game = this;

        //binding to pass this (class object) to the function
        this.timer = setTimeout(this.movement.bind(this), this.gameState.rychlost);
    }
    volnePole (nesmi_byt) {
        const xsize = this.gameState.xsize;
        const ysize = this.gameState.ysize;
        let x = 0;
        let y = 0;
        do {
            //debug(`x ${x} y ${y}`);
            y = Math.floor(Math.random() * ysize);
            x = Math.floor(Math.random() * xsize);
            //debug(this.coords(x,y));
           // debug(this.gameState.plocha[this.coords(x,y)]);
        } while (this.gameState.plocha[this.coords(x,y)] !== 0 || this.coords(x,y) === nesmi_byt);

        return new Array (x,y);
    }
    doplnZradlo (kolik, nesmi_byt) {
        for (let i=0; i < kolik; i++) {
            let pole = this.volnePole(nesmi_byt);

            this.nastavBarvu(this.coords(pole[0],pole[1]),2);
            ++this.gameState.zradla_k_dispozici;
        }
    }
    vygenerujKlic (nesmi_byt) {
        var pole = this.volnePole(nesmi_byt);
        this.nastavBarvu(this.coords(pole[0], pole[1]), 4);
        this.gameState.klic_na_scene = true;
        this.gameState.ulozeno_na_klice -= this.gameState.cena_klice;

        ++this.gameState.bodu_za_zradlo;

        this.show_klice();

        this.doplnZradlo(this.gameState.zradlo_za_klic, nesmi_byt);

        this.show_result(keyAppearMsg);
    }
    movement () {
        const xsize = this.gameState.xsize;
        const ysize = this.gameState.ysize;
        var smer_x = this.gameState.smery[Number(this.gameState.idx_smeru[this.gameState.smer])];
        var smer_y = this.gameState.smery[Number(this.gameState.idx_smeru[this.gameState.smer])+1];

        var hlavicka = this.reverse_coords(this.gameState.telicko[0]);

        smer_x += hlavicka[0];
        smer_y += hlavicka[1];

        if (smer_x >= xsize) smer_x -= xsize;
        if (smer_y >= ysize) smer_y -= ysize;
        if (smer_x < 0) smer_x += xsize;
        if (smer_y < 0) smer_y += ysize;

        var narust = 0;
        var nova_pozice = this.coords(smer_x,smer_y);
        if (this.gameState.plocha[nova_pozice] === 2) { // zradlo
            this.gameState.body += this.gameState.bodu_za_zradlo;  ++this.gameState.ulozeno_na_klice;
            this.show_body();
            this.vyresKlice(nova_pozice);
            --this.gameState.zradla_k_dispozici;  ++narust;
            this.nastavBarvu(nova_pozice,0);
        } else if (this.gameState.plocha[nova_pozice] == 4) { // klic
            ++this.gameState.klicu;
            this.show_klice();
            this.gameState.klic_na_scene = false;
            this.nastavBarvu(nova_pozice,0);

            this.gameState.body += this.gameState.bodu_za_klic;
            this.show_body();

            this.show_result(keyGotMsg);

            ++narust;

            if (this.gameState.klicu === this.gameState.klicu_v_levelu) this.vygenerujDvere(nova_pozice); else this.vyresKlice(nova_pozice);
        } else if (this.gameState.plocha[nova_pozice] === 5) { // dvere
            this.dalsiLevel();
            return;
        }

        if (this.gameState.plocha[nova_pozice] == 0) {
            this.odbarviHlavu();
            this.narustHousenky(nova_pozice,true);
            this.gameState.povolena_zmena_smeru = 1;
            if (!narust) this.nastavBarvu(this.gameState.telicko.pop(),0);
            this.rozpohybujHousenku();
        } else
        if (this.gameState.plocha[nova_pozice] === 1)
            this.koncime('worm');
        else this.koncime('wall');
    }
    vyresKlice (nesmi_byt) {
        if (this.gameState.klic_na_scene || this.gameState.dvere_na_scene) return;

        if (this.gameState.ulozeno_na_klice >= this.gameState.cena_klice)
            this.vygenerujKlic(nesmi_byt);
    }

    koncime (reason) {
        --this.gameState.lives;
        if (this.gameState.lives > 0) {
            this.gameState.body = this.gameState.body_na_zacatku_levelu;
            this.novaHra();  this.gameState.startuj_hru = 1;
            if (this.gameState.reason == "worm") this.gameState.hlaska = wormFailMsg; else this.gameState.hlaska = wallFailMsg;
            this.show_result(this.gameState.hlaska);
        } else
            this.zastavHru(reason);
    }
    vygenerujDvere (nesmi_byt) {
        var pole = this.volnePole(nesmi_byt);

        this.gameState.dvere_na_scene = true;
        this.nastavBarvu(this.coords(pole[0],pole[1]),5);
        this.doplnZradlo(this.gameState.zradlo_za_klic,nesmi_byt);

        this.show_result(doorMsg);
    }
    zastavHousenku () {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
    }
    narustHousenky (pozice,hlavicka) {
        this.gameState.telicko.unshift(pozice);
        if (hlavicka) this.nastavBarvu(pozice,6); else this.nastavBarvu(pozice,1);
    }
    odbarviHlavu () {
        this.nastavBarvu(this.gameState.telicko[0],1);
    }
    vymazHousenku () {
        while (this.gameState.telicko.length > 0) this.nastavBarvu(this.gameState.telicko.pop(),0);
    }

    coords (x,y) {
        return y * this.gameState.xsize + x;
    }
    existujePole (x,y) {
        return (x >= 0 && y >= 0 && x < this.gameState.xsize && y < this.gameState.ysize);
    }
    show_result (msg) {}
    reverse_coords (pozice) {
        var x = pozice % this.gameState.xsize;
        var y = Math.floor(pozice / this.gameState.xsize);

        return new Array (x,y);
    }
    finish_result (data) {
        this.show_result(data.message);
    }
    zed_poly (useky) {
        var last_x = useky[0];
        var last_y = useky[1];
        var i;
        for (i=2; i < useky.length; i += 2) {
            var x = useky[i];
            var y = useky[i+1];
            this.zed(last_x,last_y,x,y);
            last_x = x;  last_y = y;
        }
    }
    ridka_zed (x1,y1,x2,y2) {
        this.gameState.ridkost = true;
        this.zed(x1,y1,x2,y2);
        this.gameState.ridkost = false;
    }
    zed (x1,y1,x2,y2) {
        var steep = Math.abs(y2-y1) > Math.abs(x2-x1);
        if (steep) { var p = x1;  x1 = y1;  y1 = p;  p = x2;  x2 = y2;  y2 = p; }
        if (x1 > x2) { var p = x1;  x1 = x2;  x2 = p;  p = y1;  y1 = y2;  y2 = p; }

        var dx = x2 - x1;
        var dy = y2 - y1;

        var slope;
        if (dy < 0) {
            slope = -1;
            dy = -dy;
        } else {
            slope = 1;
        }

        var incE = 2 * dy;
        var incNE = 2 * dy - 2 * dx;
        var d = 2 * dy - dx;
        var y = y1;
        var x;
        var ted_jo = true;

        for (x=x1; x <= x2; x++) {
            if (ted_jo) if (steep) this.cihla(y,x); else this.cihla(x,y);
            if (d <= 0) d += incE;
            else { d += incNE; y += slope; }
            if (this.gameState.ridkost) ted_jo = !ted_jo;
        }
    }
    cihla (x,y) {
        this.nastavBarvu(this.coords(x,y),3);
    }
    zed_full (x1,y1,x2,y2) {
        if (y1 > y2) { var p = y1;  y1 = y2;  y2 = p; }

        var y;
        for (y=y1; y <= y2; y++) this.zed(x1,y,x2,y);
    }

    vygenerujLevel () {
        var results = new Array (0,0,0);
        const xsize = this.gameState.xsize;
        const ysize = this.gameState.ysize;
        var mujlevel = this.gameState.level-1;
        if (mujlevel > this.gameState.levels) {
            mujlevel = mujlevel % this.gameState.levels;
            if (mujlevel == 0) Math.floor(this.gameState.rychlost *= this.gameState.zrychleni);
            if (this.gameState.rychlost < 1) this.gameState.rychlost = 1;
            this.gameState.hlaska = accelMsg;
        }

        //binding to pass this (class object)
        const zed = this.zed.bind(this);
        const cihla = this.cihla.bind(this);

        results[1] = Math.floor(xsize / 2);
        results[2] = Math.floor(ysize / 2);

        this.zed_poly(new Array(0,0,xsize-1,0,xsize-1,ysize-1,0,ysize-1,0,0));

        if (mujlevel == 1) {
            zed(Math.floor(xsize/4),Math.floor(ysize/2), Math.floor(3*xsize/4), Math.floor(ysize/2));
            results[2] += 3;
        } else if (mujlevel == 2) {
            zed(Math.floor(xsize/4), 4, Math.floor(xsize/4), ysize-5);
            zed(Math.floor(3*xsize/4), 4, Math.floor(3*xsize/4), ysize-5);
        } else if (mujlevel == 3) {
            zed(4, Math.floor(ysize/2), xsize-5, Math.floor(ysize/2));
            zed(Math.floor(xsize/2), 4, Math.floor(xsize/2), ysize-5);
            results[1] += 5;  results[2] += 5;
        } else if (mujlevel == 4) {
            var x;
            for (x=8; x<xsize; x+=8)
                zed(x,0,x,ysize-7);
            results[0] = 1;
        } else if (mujlevel == 5) {
            var suda = false;
            var x;
            for (x=8; x<xsize; x+=8) {
                if (suda) zed(x,6,x,ysize-1); else zed(x,0,x,ysize-7);
                suda = !suda;
            }
            results[0] = 3;
        } else if (mujlevel == 6) {
            var x;
            for (x=8; x<xsize; x+=8) {
                zed(x,0,x,Math.floor(ysize/2)-3);
                zed(x,Math.floor(ysize/2)+3,x,ysize-1);
            }
        } else if (mujlevel == 7) {
            var suda = false;
            var y;
            for (y=6; y<ysize; y+=6) {
                if (suda) zed(6,y,xsize-1,y); else zed(0,y,xsize-7,y);
                suda = !suda;
            }
        } else if (mujlevel == 8) {
            var y;
            for (y=6; y<ysize; y+=6) {
                zed(0,y,Math.floor(xsize/2)-4,y);
                zed(Math.floor(xsize/2)+4,y,xsize-1,y);
            }
        } else if (mujlevel == 9) {
            zed(Math.floor(xsize/4)+1,6,Math.floor(3*xsize/4)-1,6);
            zed(Math.floor(xsize/4)+1,ysize-7,Math.floor(3*xsize/4)-1,ysize-7);
            zed(Math.floor(xsize/4)-1,8,Math.floor(xsize/4)-1,ysize-9);
            zed(Math.floor(3*xsize/4)+1,8,Math.floor(3*xsize/4)+1,ysize-9);
        } else if (mujlevel == 10) {
            var i;
            for (i=0; i<2; i++) {
                var n = 3*i+1;
                zed(Math.floor(n*xsize/7)+1,6,Math.floor((n+2)*xsize/7)-1,6);
                zed(Math.floor(n*xsize/7)+1,ysize-7,Math.floor((n+2)*xsize/7)-1,ysize-7);
                zed(Math.floor(n*xsize/7)-1,8,Math.floor(n*xsize/7)-1,ysize-9);
                zed(Math.floor((n+2)*xsize/7)+1,8,Math.floor((n+2)*xsize/7)+1,ysize-9);
            }
            results[0] = 1;
        } else if (mujlevel == 11) {
            var i;
            for (i=0; i<2; i++) {
                zed(Math.floor(xsize/4)+1+4*i,6+4*i,Math.floor(3*xsize/4)-1-4*i,6+4*i);
                zed(Math.floor(xsize/4)+1+4*i,ysize-7-4*i,Math.floor(3*xsize/4)-1-4*i,ysize-7-4*i);
                zed(Math.floor(xsize/4)-1+4*i,8+4*i,Math.floor(xsize/4)-1+4*i,ysize-9-4*i);
                zed(Math.floor(3*xsize/4)+1-4*i,8+4*i,Math.floor(3*xsize/4)+1-4*i,ysize-9-4*i);
            }
        } else if (mujlevel == 12) {
            zed(Math.floor(xsize/6),Math.floor(ysize/4),Math.floor(5*xsize/6),Math.floor(3*ysize/4));
            zed(Math.floor(xsize/6),Math.floor(3*ysize/4),Math.floor(5*xsize/6),Math.floor(ysize/4));
            this.zed_full(Math.floor(xsize/2)-2,Math.floor(ysize/2)-1,Math.floor(xsize/2)+2,Math.floor(ysize/2)+1);
            results[2] += 10;
        } else if (mujlevel == 13) {
            zed(Math.floor(xsize/6),Math.floor(ysize/4),Math.floor(5*xsize/6),Math.floor(3*ysize/4));
            zed(Math.floor(xsize/6),Math.floor(3*ysize/4),Math.floor(5*xsize/6),Math.floor(ysize/4));
            zed(Math.floor(xsize/2),Math.floor(ysize/6),Math.floor(xsize/2),Math.floor(5*ysize/6));
            this.zed_full(Math.floor(xsize/2)-2,Math.floor(ysize/2)-1,Math.floor(xsize/2)+2,Math.floor(ysize/2)+1);
            results[1] += 5;  results[2] += 10;
        } else if (mujlevel == 14) {
            zed(0,Math.floor(ysize/4),Math.floor(xsize/2),Math.floor(2*ysize/3));
            zed(xsize-1,Math.floor(3*ysize/4),Math.floor(xsize/2),Math.floor(ysize/3));
        } else if (mujlevel == 15) {
            zed(0,Math.floor(ysize/4),Math.floor(xsize/3),Math.floor(2*ysize/3));
            zed(xsize-1,Math.floor(3*ysize/4),Math.floor(2*xsize/3),Math.floor(ysize/3));
            zed(Math.floor(3*xsize/4),0,Math.floor(xsize/3),Math.floor(ysize/3)+1);
            zed(Math.floor(xsize/4),ysize-1,Math.floor(2*xsize/3),Math.floor(2*ysize/3)-1);
            cihla(Math.floor(xsize/4)+3,ysize-2);
            cihla(Math.floor(3*xsize/4)-3,1);
            cihla(1,Math.floor(ysize/4)+2);
            cihla(xsize-2,Math.floor(3*ysize/4)-2);
        } else if (mujlevel == 16) {
            zed(Math.floor(xsize/4)+1,Math.floor(ysize/2)-1,Math.floor(xsize/2)-1,6);
            zed(Math.floor(3*xsize/4)-1,Math.floor(ysize/2)-1,Math.floor(xsize/2)+1,6);
            zed(Math.floor(3*xsize/4)-1,Math.floor(ysize/2)+1,Math.floor(xsize/2)+1,ysize-7);
            zed(Math.floor(xsize/4)+1,Math.floor(ysize/2)+1,Math.floor(xsize/2)-1,ysize-7);
        } else if (mujlevel == 17) {
            this.ridka_zed(Math.floor(xsize/2),0,Math.floor(xsize/2),ysize-1);
            results[1] += 3;
        } else if (mujlevel == 18) {
            var suda = false;
            var x;
            for (x=8; x<xsize; x+=8) {
                if (suda) this.ridka_zed(x,0,x,ysize-1); else this.ridka_zed(x,1,x,ysize-1);
                suda = !suda;
            }
            results[0] = 3;
        } else if (mujlevel == 19) {
            zed(2,Math.floor(ysize/2),xsize-3,Math.floor(ysize/2));
            results[2] += 3;
        } else if (mujlevel == 20) {
            zed(2,Math.floor(ysize/2),xsize-3,Math.floor(ysize/2));
            zed(Math.floor(xsize/2), 2, Math.floor(xsize/2), ysize-3);
            results[1] += 5;  results[2] += 5;
        } else if (mujlevel == 21) {
            zed(2,Math.floor(ysize/2),xsize-3,Math.floor(ysize/2));
            var x;
            for (x=1; x <= 3; x++)
                zed(Math.floor(x*xsize/4), 2, Math.floor(x*xsize/4), ysize-3);
            results[1] += 5;  results[2] += 5;
            results[0] = 1;
        } else if (mujlevel == 22) {
            var suda = false;
            var x;
            for (x=8; x<xsize; x+=8) {
                if (suda) zed(x,2,x,ysize-1); else zed(x,0,x,ysize-3);
                suda = !suda;
            }
            results[0] = 3;
        } else if (mujlevel == 23) {
            var i;
            for (i=0; i<2; i++) {
                var n = 3*i+1;
                zed(Math.floor(n*xsize/7)+1,3+i*Math.floor(ysize/2),Math.floor((n+2)*xsize/7)-1,3+i*Math.floor(ysize/2));
                zed(Math.floor(n*xsize/7)+1,Math.floor(ysize/2)-3+i*Math.floor(ysize/2),Math.floor((n+2)*xsize/7)-1,Math.floor(ysize/2)-3+i*Math.floor(ysize/2));
                zed(Math.floor(n*xsize/7)-1,5+i*Math.floor(ysize/2),Math.floor(n*xsize/7)-1,Math.floor(ysize/2)-5+i*Math.floor(ysize/2));
                zed(Math.floor((n+2)*xsize/7)+1,5+i*Math.floor(ysize/2),Math.floor((n+2)*xsize/7)+1,Math.floor(ysize/2)-5+i*Math.floor(ysize/2));

                n = 3*((i+1) % 2) + 1;

                zed(Math.floor(n*xsize/7)+1,Math.floor(ysize/2)-3+i*Math.floor(ysize/2),Math.floor((n+2)*xsize/7)-1,Math.floor(ysize/2)-3+i*Math.floor(ysize/2));
                zed(Math.floor((n+1)*xsize/7)-1,4+i*Math.floor(ysize/2),Math.floor(n*xsize/7)-1,Math.floor(ysize/2)-5+i*Math.floor(ysize/2));
                zed(Math.floor((n+1)*xsize/7)+1,4+i*Math.floor(ysize/2),Math.floor((n+2)*xsize/7)+1,Math.floor(ysize/2)-5+i*Math.floor(ysize/2));
                cihla(Math.floor(n*xsize/7)-1,Math.floor(ysize/2)-4+i*Math.floor(ysize/2));
                cihla(Math.floor((n+2)*xsize/7)+1,Math.floor(ysize/2)-4+i*Math.floor(ysize/2));
            }
        }

        return results;
    }

    vymazPlochu() {
        for (let i in this.gameState.plocha)
            this.nastavBarvu(i,0);
    }

    nastavBarvu(index, color) {
        this.gameState.plocha[index] = color;
    }

    callFinish(body, reason) {
        this.gameState = new GameState();
        this.novaHra();
    }
}
const DEBUG = true;
function debug(output) {
    if (DEBUG) console.log(output);
}

exports.ServerGame = ServerGame;
exports.GameState = GameState;



