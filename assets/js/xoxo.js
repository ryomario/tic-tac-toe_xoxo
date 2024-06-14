(function(){
    /**
     * 
     * @param {string} tagname HTML Tag Element
     * @param {string|Array} classlist List of class name
     * @param {NamedNodeMap} attributes HTML Attributes
     * @param {CSSStyleDeclaration} styles CSS Styles
     * @param {string} innerText text to be content of element
     */
    function CreateNode(tagname, classes, attributes, styles, innerText) {
        const el = document.createElement(tagname);

        if(classes){
            if(typeof classes == 'string')el.className = classes;
            else el.className = classes.join(' ');
        }
        if(attributes)Object.assign(el,attributes);
        if(styles)Object.assign(el.style, styles);
        if(innerText)el.innerText = innerText;

        return el;
    }
    const WIN_STATES = [
        [1,2,3],[1,4,7],[1,5,9],[2,5,8],[3,6,9],[3,5,7],[4,5,6],[7,8,9]
    ];
    /**
     * 
     * @param {Array} state list of number that indicate the state of one player
     */
    function CheckWinState(state) {
        if(!Array.isArray(state))return console.warn('Check win state error!');

        for (const winstate of WIN_STATES) {
            let win = true;
            for (const num of winstate) {
                if(state.findIndex(n => n == num) === -1)win = false;
            }
            if(win)return true;
        }
        return false;
    }

    window.xOxOGame = xOxOGame;

    function xOxOGame(containerId, options) {
        if(!(this instanceof xOxOGame)) return new xOxOGame(containerId, options);

        const $this = this;

        if(!containerId)throw Error('parameter "containerId" is required.');
        if(typeof containerId !== 'string')throw Error('parameter "containerId" must be string.');

        const parentelem = document.getElementById(containerId);

        if(!parentelem)throw Error(`Container element with id "${containerId}" not found in DOM.`);

        while(parentelem.firstChild)parentelem.removeChild(parentelem.lastChild);

        parentelem.classList.add('xoxo');

        // merge opts


        // constant

        const players = ['x','o'];
        const boardnums = [
            1,2,3,
            4,5,6,
            7,8,9,
        ];
        const maxplayerturnhistory = 3; // helper for game mode 'continually'

        // variables

        var gamemode; // normal, continually

        var currturn; // x, o
        var isrunning; // true, false
        var isdraw; // true, false
        var winner; // null, x, o

        var review_game; // true, false

        // internal use

        var currdialog;
        
        /**
         * cell_1: 'x'
         * cell_2: 'o'
         */
        var boardmap = {};
        var playersturnshistory = {};

        const elems = {
            title: CreateNode('div',['xoxo_title']),
            options: CreateNode('div',['xoxo_options']),
            board: CreateNode('div',['xoxo_board']),

            option_mode_input: CreateNode('select',['xoxo_option_input']),

            cell_1: CreateNode('div',['xoxo_cell','xoxo_cell--1']),
            cell_2: CreateNode('div',['xoxo_cell','xoxo_cell--2']),
            cell_3: CreateNode('div',['xoxo_cell','xoxo_cell--3']),
            cell_4: CreateNode('div',['xoxo_cell','xoxo_cell--4']),
            cell_5: CreateNode('div',['xoxo_cell','xoxo_cell--5']),
            cell_6: CreateNode('div',['xoxo_cell','xoxo_cell--6']),
            cell_7: CreateNode('div',['xoxo_cell','xoxo_cell--7']),
            cell_8: CreateNode('div',['xoxo_cell','xoxo_cell--8']),
            cell_9: CreateNode('div',['xoxo_cell','xoxo_cell--9']),

            bar: CreateNode('div',['xoxo_bar']),
            btn_newgame: CreateNode('button',['xoxo_btn']),
        };

        elems.title.textContent = 'TIC TAC TOE - XOXO';

        parentelem.appendChild(elems.title);
        parentelem.appendChild(elems.options);
        parentelem.appendChild(elems.board);
        parentelem.appendChild(elems.bar);

        elems.board.appendChild(elems.cell_1);
        elems.board.appendChild(elems.cell_2);
        elems.board.appendChild(elems.cell_3);
        elems.board.appendChild(elems.cell_4);
        elems.board.appendChild(elems.cell_5);
        elems.board.appendChild(elems.cell_6);
        elems.board.appendChild(elems.cell_7);
        elems.board.appendChild(elems.cell_8);
        elems.board.appendChild(elems.cell_9);

        elems.btn_newgame.innerText = 'New game';
        elems.bar.appendChild(elems.btn_newgame);

        // Handle options

        const elem_option_mode = CreateNode('div',['xoxo_option']);
        const elem_option_mode_label = CreateNode('div',['xoxo_option_label']);
        elem_option_mode_label.textContent = 'Mode';
        elems.option_mode_input.appendChild(CreateNode('option','',{value: 'normal'},null,'Normal'));
        elems.option_mode_input.appendChild(CreateNode('option','',{value: 'continually'},null,'Continually'));

        elem_option_mode.appendChild(elem_option_mode_label);
        elem_option_mode.appendChild(elems.option_mode_input);
        elems.options.appendChild(elem_option_mode);

        // Handle game mode option change
        function HandleGameModeOption(e) {
            const new_gamemode = e.target.value;
            if(['normal', 'continually'].findIndex(s => s == new_gamemode) === -1)throw Error(`Game mode '${new_gamemode}' is not applicable!`);

            $this.Dialog('Change Game Mode must be RESTART the game!','Restart',(dialog) => {
                gamemode = new_gamemode;
                $this.NewGame();
                return true;
            },() => {
                elems.option_mode_input.value = gamemode;
            },true).open();
        }
        elems.option_mode_input.addEventListener('input', HandleGameModeOption);

        /**
         * 
         * @param {string} message Messages to get displayed
         * @param {string} button_text Button label
         * @param {undefined|DefaultDialogCallback} button_callback triggered on click button in dialog, and return boolean to control close dialog or not
         * @param {undefined|()=>{}} cancel_callback triggered on dialog closed
         * @param {boolean} cancelonclickoutside control is dialog closed on click outide dialog, default false
         */
        $this.Dialog = function(message, button_text, button_callback, cancel_callback = null, cancelonclickoutside = false) {
            if(currdialog)currdialog.close(true);
            currdialog = false;

            if(!message)message = 'This is a dialog!';
            if(!button_text)button_text = 'Close';
            if(!button_callback)button_callback = DefaultDialogCallback;


            const dialog = CreateNode('dialog',['xoxo_endgame']);
            const dialog_msg = CreateNode('div',['xoxo_endgame_msg']);
            const dialog_btn = CreateNode('button',['xoxo_btn']);

            dialog.appendChild(dialog_msg);
            dialog.appendChild(dialog_btn);
            dialog_msg.innerHTML = message;
            dialog_btn.innerHTML = button_text;

            function HandleCloseDialog(e) {
                parentelem.removeChild(dialog);
                dialog.removeEventListener('close',HandleCloseDialog);

                console.log('dialog closed');
                if(cancel_callback && typeof cancel_callback === 'function')cancel_callback(dialog);
                currdialog = false;
            }
            dialog.addEventListener('close',HandleCloseDialog);


            var ClickHandle = function(e) {
                if(e.target === dialog_btn) {
                    if(button_callback(dialog)){
                        dialog.removeEventListener('close',HandleCloseDialog);
                        
                        dialog.close();

                        setTimeout(()=>{
                            parentelem.removeChild(dialog);
                        },500);
                        dialog_btn.removeEventListener('click',ClickHandle);
                    }
                } else {
                    let rect = dialog.getBoundingClientRect();
                    let isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
                        rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
                    if (!isInDialog && cancelonclickoutside) {
                        dialog.close();
                    }
                }
            }

            parentelem.appendChild(dialog);
            dialog.addEventListener('click', ClickHandle);

            currdialog = {
                open: () => {
                    dialog.showModal();
                },
                close: (force = false) => {
                    if(force)dialog.removeEventListener('close',HandleCloseDialog);
                    dialog.close();
                },
            }

            return currdialog;
        }
        /**
         * 
         * @param {HTMLDialogElement} dialog HTML Dialog
         * @returns true for close the dialog
         */
        var DefaultDialogCallback = function(dialog) {
            console.log('dialog closed');
            return true;
        }

        /**
         * 
         * @returns get random player 'x' or 'o'
         */
        function GetRandomPlayer() {
            const randid = Math.round(Math.random() * (players.length - 1));
            return players[randid];
        }
        /**
         * 
         * @param {number|string|HTMLElement} mark 'o' or 'x'
         * @param {boolean} isLabel if true, added class _xoxo_cell_label_
         */
        function SetCell(cell, mark, isLabel = true, willbe_deleted = false) {
            if(typeof cell === 'number')cell = elems['cell_'+cell];
            else if(typeof cell === 'string')cell = elems[cell];

            if(!cell)return;

            while(cell.firstChild)cell.removeChild(cell.lastChild);
            
            const mark_el = CreateNode('div',['xoxo_mark']);
            if(mark)mark_el.classList.add('xoxo_mark--'+mark);
            if(isLabel)mark_el.classList.add('xoxo_cell_label');
            if(willbe_deleted)mark_el.classList.add('xoxo_mark_will_deleted');

            cell.appendChild(mark_el);
        }
        /**
         * 
         * @param {number} cell cell index in the board
         */
        function GetCellMap(cell) {
            if(typeof cell !== 'number')throw Error('Cell index "'+cell+'" not a number!');

            if(!boardmap)throw Error('Internal error: Board not mapped!');

            const map = boardmap['cell_'+cell];

            return map ?? false;
        }
        function ChangeTurn() {
            let nextidx = 0;
            let curridx = players.findIndex(p => p === currturn);
            
            if(curridx >= 0 && curridx < players.length - 1)nextidx = curridx + 1;

            currturn = players[nextidx];
        }
        function CheckGameState() {
            const players_states = {};
            for (const num of boardnums) {
                for (const player of players) {
                    if(boardmap['cell_'+num] === player){
                        if(!players_states[player])players_states[player] = [];
                        players_states[player].push(num);
                    }
                }
            }

            winner = false;
            for (const player of players) {
                if(players_states[player] && CheckWinState(players_states[player])){
                    winner = player;
                    break;
                }
            }

            if(winner !== false){
                // got win
                isrunning = false;
            } else {
                // check if no more available move
                let available_move = 0;
                for (const num of boardnums) {
                    if(!boardmap['cell_'+num])available_move += 1;
                }

                // no available move, draw
                if(available_move === 0) {
                    isrunning = false;
                    isdraw = true;
                }
            }
        }

        /**
         * 
         * @param {number|string} cell Indicating a cell index for map
         * @param {boolean} updateui Control to update the interface or not
         */
        function MarkCurrentTurn(cell, updateui = true) {
            let cell_num;
            if(typeof cell === 'number') {
                cell_num = cell;
                cell = 'cell_'+cell;
            } else if(typeof cell === 'string') cell_num = Number(cell.replace('cell_',''));

            if(typeof cell !== 'string')return console.warn('Cannot marking cell!');

            if(!isrunning){
                if(updateui){
                    $this.RefreshDOM();
                }

                return console.warn('Game is already ended, start New Game instead!');
            }

            if(boardmap[cell])return console.warn('Cell already marked!');

            // wrap for game mode 'continually'
            if(gamemode == 'continually'){
                // init if null
                if(!playersturnshistory[currturn])playersturnshistory[currturn] = [];

                const removed_turns = [];
                // check if at max history count
                while(playersturnshistory[currturn].length >= maxplayerturnhistory) {
                    removed_turns.push(playersturnshistory[currturn].shift());
                }

                // add to history
                playersturnshistory[currturn].push(cell_num);
                
                // remove mapped mark that removed from history
                for (const num of removed_turns) {
                    boardmap['cell_'+num] = false;
                }
            }

            // mapping the mark
            boardmap[cell] = currturn;

            // change to next turn
            ChangeTurn();

            // check state
            CheckGameState();
            
            // update ui
            if(updateui){
                $this.RefreshDOM();
            }
        }
        function HandleCellClick(e) {
            if(!e.isTrusted)return;

            // check if cliked inside board
            let node = e.target;
            while(node && node !== elems.board)node = node.parentNode;
            if(node !== elems.board)return;

            // get the clicked cell
            const cell = e.target.closest('.xoxo_cell');
            // check if clicked cell is exist, do samething for get the cell num
            let isexist = 0;
            for (const num of boardnums) {
                if(cell === elems['cell_' + num]){
                    isexist = num;
                    break;
                }
            }
            if(!isexist || isexist === 0)return console.warn('You are not clicked the cell!');

            if(!cell.lastChild)return console.warn('The clicked cell doesn`t have a child!');
            
            if(!cell.lastChild.classList.contains('xoxo_cell_label'))return console.warn('The clicked cell doesn`t have a label!');

            // start action
            MarkCurrentTurn(isexist);
        }
        elems.board.addEventListener('click', HandleCellClick);
        
        function HandleButtonNewGameClick(e) {
            if(!e.isTrusted)return;
            
            $this.Dialog('Start New Game?', 'Start', ()=>{
                $this.NewGame();
                return true;
            }).open();
        }
        elems.btn_newgame.addEventListener('click', HandleButtonNewGameClick);

        $this.RefreshDOM = function() {
            // refresh options value
            elems.option_mode_input.value = gamemode;


            boardnums.forEach(num => {
                let mark = currturn;
                let islabel = true;
                if(GetCellMap(num) !== false){
                    mark = GetCellMap(num);
                    islabel = false;
                }

                let willbe_removed = false;
                if(gamemode == 'continually'){
                    if(playersturnshistory[mark] && playersturnshistory[mark].length >= maxplayerturnhistory){
                        willbe_removed = num == playersturnshistory[mark][0];
                    }
                }

                SetCell(num, mark, islabel, willbe_removed);
            });

            if(!isrunning) {
                // diable board event
                parentelem.classList.add('xoxo_gameover');
                elems.board.title = 'Game is already ended!';

                let content = '';

                if(review_game) {
                    content += `<p>Game already ended!</p>`;
                }

                if(!isdraw){
                    content += 'The winner';
                    content += `
                    <div class="xoxo_cell"><div class="xoxo_mark xoxo_mark--${winner}"></div></div>
                    `;
                } else {
                    content += 'Draw!';
                }
                $this.Dialog(content,'New Game', (dialog) => {
                    $this.NewGame();
                    return true;
                },(dialog) => {
                    review_game = true;
                },true).open();
            } else {
                parentelem.classList.remove('xoxo_gameover');
                elems.board.title = '';
            }
        }
        $this.NewGame = async function() {
            // don't reset current options
            if(!gamemode)gamemode = 'normal';

            isrunning = true;
            isdraw = false;
            winner = null;
            review_game = false;
            currturn = GetRandomPlayer();
            boardmap = {};
            playersturnshistory = {};

            $this.RefreshDOM();
        }
        
        
        
        $this.NewGame();
        // $this.Dialog('Start New Game!', 'Start', ()=>{
        //     $this.NewGame();
        //     return true;
        // }).open();
    }
})()