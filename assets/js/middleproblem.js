var middleProblem = (function () {
    
    
    // 구분 값 정의
    
    /**
     *  resultCd
     *  
     *  0 : 오답
     *  1 : 세모
     *  2 : 정답
     *  3 : 채점중
     */
    
    /**
     *  problemType
     * 
     *  20 : 2지선다 객관식
     *  30 : 3지선다 객관식
     *  40 : 4지선다 객관식
     *  50 : 5지선다 객관식
     *  60 : 단답형 유순형(답이여러개)
     *  61 : 단답형 무순형(답이한개)
     *  70 : 논술형
     */
    
    var corsHeader = {
        'GROUP': 'sigong-server-family'
    };
    var state = {
        pagePath: "/sigong/test/middle/onlineProblem.do",
        schoolingApiEndpoint: '',
        stuId: 9426,
        studyElmtUid: null, // 학습요소 key 값
        planServiceUid: null, // 스케쥴링 key값(스케쥴링된 학습일 경우에만)
        pid: null, // 문항번호
        num: null, // 문제번호
        paginationData: [], // 페이징 블럭 Data
        problemData: [], // 문제 Data
        answerData: null, // 정답 Data
        choiceNumUnicode: '&#931',
        isShowAnswer: false, // 정답보기 토글
        myAnswer: null, // 나의 답 선택
        myAnswerArray: [], // 나의 답 단답
        penYn: 'N', // 필기펜 입력 여부
        penImgUrl: '', // 필기펜 이미지 URL
        score: null, // 자가채점
        audioUrl: null, // 음성 URL
        doProblem: false, // 정답확인 여부
        evaluate: null, // 평가점수
        cntResult: [0, 0], // [0, 0] 맞힌 문제, 틀린 문제 카운트
        cntResultFalse: 0, // 오답 카운트
        inputTarget: null, // 키패드 입력 타겟
        localStorage: null
    };
    
    // 페이지데이터 가져오기
    function getPagination() {
        var params = {
            studyElmtUid: state.studyElmtUid,
            planServiceUid: state.planServiceUid
        };
        
        $.ajax({
            url : state.schoolingApiEndpoint + "/api/exam/openStudyProblem.djson",
            data: params,
            type: 'GET',
            contentType : "application/json; charset=UTF-8",
            headers : corsHeader,
            success : function (res) {
                state.paginationData = res.result;
                if(!state.planServiceUid) {
                    if(!state.localStorage) {
                        // 로컬스토리지 세팅
                        state.localStorage = {};
                        state.localStorage[state.studyElmtUid] = state.paginationData;
                        localStorage.setItem('paginationData_' + state.stuId, JSON.stringify(state.localStorage));
                    } else {
                        if(!state.localStorage[state.studyElmtUid]) {
                            state.localStorage[state.studyElmtUid] = state.paginationData;
                            localStorage.setItem('paginationData_' + state.stuId, JSON.stringify(state.localStorage));
                        } else {
                            state.paginationData = state.localStorage[state.studyElmtUid];
                        }
                    }
                }
                
                // 지정한 페이지 없으면
                if(!state.num) {
                    // 스케줄링 시작페이지를 현재 페이지로
                    state.num = state.paginationData.startProblemInfo.num;
                    state.pid = state.paginationData.startProblemInfo.problemId;
                }
                
                getProblem();
                makePagination();
            },
            error : function () {
                window['android'].showWebDialog(0, '알림', '시스템에 문제가 발생하였습니다.', '확인', null);
            }
        });
    };
    
    // 문제데이터 가져오기
    function getProblem() {
        var params = {
            pid: state.pid,
            num: state.num || 1
        };
        
        $.ajax({
            url : "/sigong/test/middle/api/problem.json",
            data : params,
            type: 'GET',
            contentType : "application/json; charset=UTF-8",
            headers : corsHeader,
            success : function (res) {
                state.problemData = res;
                makeProblem();
                $('.container').removeClass('hide');
                
                if($(':input:text').length > 0) {
                    $(':input:text')[0].click();
                }
            },
            error : function () {
                window['android'].showWebDialog(0, '알림', '시스템에 문제가 발생하였습니다.', '확인', null);
            }
        });
    };
    
    // 정답 보기
    function getAnswer() {
        var params = {
            pid: state.pid,
            stuId: state.stuId,
            answer: encodeURI(state.myAnswer),
            penYn: state.penYn,
            penImgUrl: state.penImgUrl,
            openDt: yyyymmddhhmmss(),
            gradeStudyElmtUid: state.studyElmtUid,
            planServiceUid: state.planServiceUid
        };
        
        // 논술형일때
        if(state.problemData.problemType == '70') {
            params.nonsulYn = 'Y';
            params.result = (state.score) ? '2' : '0';
            if(state.penYn == 'Y') {
                params.answer = '';
            } else {
                params.penImgUrl = '';
            }
        }
        
        $.ajax({
            url : "/sigong/test/middle/api/insertProblemAnswer.json",
            data : params,
            type: 'GET',
            contentType : "application/json; charset=UTF-8",
            headers : corsHeader,
            success : function (res) {
                if(res.resultCd == '0') {
                    if(state.problemData.problemType != '70') {
                        if(state.cntResultFalse == 0) {
                            state.cntResultFalse++;
                            showCheckTheAnswer();
                            return false;
                        }
                    }
                }
                
                $('.container').addClass('showanswer');
                $('.btn-answer').text('정답 닫기').addClass('open');
                
                state.answerData = res;
                
                // 로컬스토리지 정답 세팅
                if(!state.planServiceUid) {
                    if(state.localStorage) {
                        var storage = state.localStorage[state.studyElmtUid];
                        storage.problemList[state.num - 1].answer = state.answerData.answer;
                        storage.problemList[state.num - 1].answerRate = state.answerData.problemAnswerRate.answerRate;
                        storage.problemList[state.num - 1].explain = state.answerData.explain;
                        storage.problemList[state.num - 1].myAnswer = state.answerData.myAnswer;
                        storage.problemList[state.num - 1].penImgUrl = state.answerData.penImgUrl;
                        storage.problemList[state.num - 1].result = state.answerData.resultCd;
                        
                        if(state.num >= storage.problemList.length) {
                            storage.isTestComplete = true;
                            storage.startProblemInfo.num = storage.problemList[0].num;
                            storage.startProblemInfo.problemId = storage.problemList[0].problemId;
                        } else {
                            storage.startProblemInfo.num = storage.problemList[state.num].num;
                            storage.startProblemInfo.problemId = storage.problemList[state.num].problemId;
                        }
                        
                        state.localStorage[state.studyElmtUid] = storage;
                        state.paginationData = storage;
                        localStorage.setItem('paginationData_' + state.stuId, JSON.stringify(state.localStorage));
                    }
                } else {
                    if(state.num >= state.paginationData.problemList.length) {
                        state.paginationData.isTestComplete = true;
                        state.paginationData.problemList[state.num - 1].result = state.answerData.resultCd;
                    }
                }
                
                // 논술형이 아니면
                if(state.problemData.problemType != '70') {
                    state.doProblem = true;
                }
                
                $('.answer .content .hit').html(state.answerData.answer);
                $('.answer .content .desc').html(state.answerData.explain);
                if(state.problemData.problemType == '70') $('.answer .content .desc').addClass('hide'); // 논술형일 경우 풀이 없음
                $('.answer .content .percentage .percent').html(state.answerData.problemAnswerRate.answerRate);
                
                if(state.answerData.isPenInput == true) {
                    // 자가채점 버튼 노출
                    $('.answer .content .score').removeClass('hide');
                } else {
                    // 앱 연동 버튼 노출
                    if(state.problemData.videoUrl) $('.answer .content .app .btn-video').removeClass('hide');
                    if(state.problemData.listeningNoteUrl) $('.answer .content .app .btn-listen').removeClass('hide');
                    if(state.problemData.readingNoteUrl) $('.answer .content .app .btn-checktime').removeClass('hide');
                    if(state.problemData.checkTimeUrl) $('.answer .content .app .btn-checktime').removeClass('hide');
                    $('.answer .content .app').removeClass('hide');
                }
                $('.answer .content').removeClass('hide');
                
                // 다음 버튼 활성화
                if($('.footer .btn-next').hasClass('disabled')) {
                    $('.footer .btn-next').removeClass('disabled').prop('disabled', false);
                    var nextPage = $('.footer .btn-next').attr('onclick');
                    $('.pagination .page-link:eq(' + state.num + ')').attr('onclick', nextPage);
                    
                }
                
                // 문제 채점
                if(state.answerData.resultCd) {
                    switch(state.answerData.resultCd) {
                        case '0':
                            $('.problem .question').removeClass('true');
                            $('.problem .question').addClass('false');
                            break;
                        case '2':
                            $('.problem .question').removeClass('false');
                            $('.problem .question').addClass('true');
                            break;
                        default:
                    }
                }
                
                // 학습종료 버튼 생성
                if(state.paginationData.isTestComplete) {
                    // 최종 카운트
                    state.cntResult = [0, 0];
                    for(var i of state.paginationData.problemList) {
                        if(i.result == '0') {
                            state.cntResult[1]++;
                        } else if(i.result == '2') {
                            state.cntResult[0]++;
                        }
                    }
                    
                    $('.footer .btn-result').removeClass('hide');
                    var pageLength = state.paginationData.problemList.length;
                    if(state.num == pageLength) {
                        onPageChanged(true);
                    }
                }
                
                // renderMathJax();
            },
            error : function () {
                window['android'].showWebDialog(0, '알림', '시스템에 문제가 발생하였습니다.', '확인', null);
            }
        });
    }
    
    // 논술형 정답 확인
    function getPenAnswer() {
        var params = {
            pid: state.pid
        };
            
        $.ajax({
            url : "/sigong/test/middle/api/getProblemAnswer.json",
            data : params,
            type: 'GET',
            contentType : "application/json; charset=UTF-8",
            headers : corsHeader,
            success : function (res) {
                state.answerData = res;
                
                $('.answer .content .hit').html(state.answerData.answer);
                $('.answer .content .desc').html(state.answerData.explain);
                if(state.problemData.problemType == '70') $('.answer .content .desc').hide(); // 논술형일 경우 풀이 없음
                $('.answer .content .percentage .percent').html(state.answerData.problemAnswerRate.answerRate);
                
                $('.answer .content .score').removeClass('hide');
                
                $('.answer .content').removeClass('hide');
                
                // renderMathJax();
            },
            error : function () {
                window['android'].showWebDialog(0, '알림', '시스템에 문제가 발생하였습니다.', '확인', null);
            }
        });
    }
    
    // 나의 평가
    function doEvaluate() {
        var params = {
            pid: state.pid,
            stuId: state.stuId,
            eval: state.evaluate
        };
            
        $.ajax({
            url : "/sigong/test/middle/api/insertProblemEval.json",
            data : params,
            type: 'GET',
            contentType : "application/json; charset=UTF-8",
            headers : corsHeader,
            async : false,
            success : function (res) {
                console.log('insertProblemEval success');
            },
            error : function () {
                window['android'].showWebDialog(0, '알림', '시스템에 문제가 발생하였습니다.', '확인', null);
            }
        });
    }
    
    // 페이지 이동
    function moveToProblem(problemId, num) {
        if(problemId) {
            if($('.answer .evaluate input:checked').val()) {
                state.evaluate = $('.answer .evaluate input:checked').val();
                doEvaluate();
            }
            
            var url = '';
            url += state.pagePath + '?pid=' + problemId;
            if(state.studyElmtUid) url += '&studyElmtUid=' + state.studyElmtUid;
            if(state.planServiceUid) url += '&planServiceUid=' + state.planServiceUid;
            url += '&num=' + num;
            url += '&sFrontSa=' + encodeURIComponent(corsHeader['front-sa']);
            location.href = url;
        }
    }
    
    // 페이징 블럭 생성
    function makePagination() {
        var pageLength = state.paginationData.problemList.length;
        var paginationHtml = '';
        
        paginationHtml += '<div class="mask">';
        paginationHtml += '<div class="nav dragscroll">';
        var scrollWidth = 43 * pageLength + 31 * 2; // li width * 개수 + 좌우 padding
        paginationHtml += '<ul class="pagination" style="width: ' + scrollWidth +'px">';
        state.paginationData.problemList.forEach(function(list, i){
            //현재 페이지보다 높은 페이지
            if(list.num > state.num) {
                // 이미 풀었던 페이지
                if(state.paginationData.isTestComplete || list.num <= state.paginationData.startProblemInfo.num) {
                    // 채점 결과
                    if(list.result) {
                        switch (list.result) {
                            case '0':
                                paginationHtml += '<li class="page-item miss"><a class="page-link" href="#" onClick="middleProblem.moveToProblem(' + list.problemId + ', ' + list.num + ')">' + list.num + '</a></li>';
                                break;
                            case '2':
                                paginationHtml += '<li class="page-item hit"><a class="page-link" href="#" onClick="middleProblem.moveToProblem(' + list.problemId + ', ' + list.num + ')">' + list.num + '</a></li>';
                                break;
                            default:
                                paginationHtml += '<li class="page-item"><a class="page-link" href="#" onClick="middleProblem.moveToProblem(' + list.problemId + ', ' + list.num + ')">' + list.num + '</a></li>';
                        }
                    } else {
                        paginationHtml += '<li class="page-item"><a class="page-link" href="#" onClick="middleProblem.moveToProblem(' + list.problemId + ', ' + list.num + ')">' + list.num + '</a></li>';
                    }
                }
                // 아직 풀지않은 페이지
                else {
                    paginationHtml += '<li class="page-item"><a class="page-link" href="#" onClick="event.preventDefault()">' + list.num + '</a></li>';
                }
            }
            // 현재 페이지 일때
            else if(list.num == state.num) {
                paginationHtml += '<li class="page-item on"><a class="page-link" href="#" onClick="middleProblem.moveToProblem(' + list.problemId + ', ' + list.num + ')">' + list.num + '</a></li>';
            }
            // 현재 페이지보다 낮은 페이지
            else {
                if(list.result) {
                    switch (list.result) {
                        case '0':
                            paginationHtml += '<li class="page-item miss"><a class="page-link" href="#" onClick="middleProblem.moveToProblem(' + list.problemId + ', ' + list.num + ')">' + list.num + '</a></li>';
                            break;
                        case '2':
                            paginationHtml += '<li class="page-item hit"><a class="page-link" href="#" onClick="middleProblem.moveToProblem(' + list.problemId + ', ' + list.num + ')">' + list.num + '</a></li>';
                            break;
                        default:
                            paginationHtml += '<li class="page-item"><a class="page-link" href="#" onClick="middleProblem.moveToProblem(' + list.problemId + ', ' + list.num + ')">' + list.num + '</a></li>';
                    }
                } else {
                    paginationHtml += '<li class="page-item"><a class="page-link" href="#" onClick="middleProblem.moveToProblem(' + list.problemId + ', ' + list.num + ')">' + list.num + '</a></li>';
                }
            }
        });
        paginationHtml += '</ul>';
        paginationHtml += '</div>'; // nav
        if(state.paginationData.isTestComplete) {
            paginationHtml += '<button class="btn btn-result" onClick="middleProblem.showResult()"></button>';
        } else {
            paginationHtml += '<button class="btn btn-result hide" onClick="middleProblem.showResult()"></button>';
        }
        paginationHtml += '</div>'; // mask
        if(state.num < pageLength) {
            if(state.paginationData.isTestComplete || state.num < state.paginationData.startProblemInfo.num) {
                paginationHtml += '<button class="btn btn-next" onClick="middleProblem.moveToProblem(' + state.paginationData.problemList[state.num].problemId + ', ' + (state.num+1) + ')">다음</button>';
            } else {
                paginationHtml += '<button class="btn btn-next disabled" disabled onClick="middleProblem.moveToProblem(' + state.paginationData.problemList[state.num].problemId + ', ' + (state.num+1) + ')">다음</button>';
            }
        }
        
        $('.footer').html(paginationHtml);
        
        // 학습종료 버튼 생성
        if(state.paginationData.isTestComplete) {
            // 정답, 오답 카운트
            for(var i of state.paginationData.problemList) {
                if(i.result == '0') {
                    state.cntResult[1]++;
                } else if(i.result == '2') {
                    state.cntResult[0]++;
                }
            }
            // 결과 버튼 보여주기
            $('.footer .btn-result').removeClass('hide');
            if(state.num == pageLength) {
                onPageChanged(true);
            } else {
                onPageChanged(false);
            }
        } else {
            onPageChanged(false);
        }
    };
    
    // 문제 생성
    function makeProblem() {
        // 타이틀 유형 생성
        if(state.paginationData.problemList[state.num-1].typeTitle) {
            $('body').addClass('type');
            $('.problem_type .title').text(state.paginationData.problemList[state.num-1].typeTitle);
        }
        
        // 지문 생성
        if(state.problemData.header) {
            $('.header').html(state.problemData.header);
            $('.container').removeClass('noheader');
        } else {
            $('.container').addClass('noheader');
        }
        
        // 음성파일 생성
        if(state.problemData.audioUrl) {
            state.audioUrl = state.problemData.audioUrl;
            $('.problem .voice').removeClass('hide');
        }
        
        // 문제 타이틀 생성
        if(state.problemData.problem) {
            $('.problem .question').html(state.problemData.problem);
            if(state.paginationData.isPlannedProblems) {
                $('.container .problem .question > p:first-child').prepend('<span class="proNum">' + state.num + '. </span>');
            } else {
                if(state.problemData.num) {
                    $('.container .problem .question > p:first-child').prepend('<span class="proNum">' + state.problemData.num + '. </span>');
                }
            }
        }
        
        // 선택형 보기 생성
        if(state.problemData.choiceList.length > 0) {
            var choiceListHtml = '';
            choiceListHtml = '<ul>';
            state.problemData.choiceList.forEach(function(list, i){
                choiceNum = state.choiceNumUnicode + (Number(list.answer) + 1);
                choiceListHtml += '<li data-answer="' + choiceNum + '"><a href="#"><span>' + choiceNum + '</span><div>' + list.choice +'</div></a></li>';
            });
            choiceListHtml += '</ul>';
            $('.problem .choiceList').html(choiceListHtml) ;
        } else {
            $('.problem .choiceList').addClass('hide');
        }
        
        // 문제 라벨
        if(state.problemData.property1) {
            $('.problem .label').text(state.problemData.property1);
            switch(state.problemData.property1) {
                case '사고력+':
                    $('.problem .label').addClass('green');
                    break;
                case '고난도':
                    $('.problem .label').addClass('orange');
                    break;
                case '중요':
                    $('.problem .label').addClass('pink');
                    break;
                case '기출+':
                    $('.problem .label').addClass('blue');
                    break;
                default:
            }
        } else {
            $('.problem .label').addClass('hide');
        }
        
        // 필기펜 여부
        if(state.problemData.isPenInput) {
            state.penYn = 'Y';
            $('.problem .penInput').removeClass('hide');
        }
        
        // 정답 체킹
        if(state.paginationData.problemList[state.num-1].result) {
            state.doProblem = true;
            $('.btn-answer').prop('disabled', false);
            
            // 정답, 오답 채점
            switch (state.paginationData.problemList[state.num-1].result) {
                case '0':
                    $('.problem .question').addClass('false');
                    break;
                case '2':
                    $('.problem .question').addClass('true');
                    break;
                default:
            }
            
            // 나의 답 선택
            if(state.paginationData.problemList[state.num-1].myAnswer) {
                var myAnswer = state.paginationData.problemList[state.num-1].myAnswer;
                
                // 문제 유형
                switch(state.problemData.problemType) {
                    case '20':
                    case '30':
                    case '40':
                    case '50':
                        var myAnswers = myAnswer.split('/*ROW*/');
                        myAnswers.forEach(function(list, i){
                            $('.problem .choiceList li[data-answer=' + list + ']').addClass('on');
                        });
                        break;
                    case '60':
                        state.myAnswerArray = myAnswer.split('/*ROW*/');
                        $(".problem .question input[type=text]").prop('readonly', true).each(function(i){
                            $(this).val(state.myAnswerArray[i]);
                        });
                        break;
                    case '61':
                        state.myAnswerArray = myAnswer.split('/*ROW*/');
                        $(".problem .question input[type=text]").prop('readonly', true).each(function(i){
                            $(this).val(state.myAnswerArray[i]);
                        });
                        // $('.problem .question input[type=text]').val(myAnswer).prop('readonly', true);;
                        break;
                    case '70':
                        if(state.paginationData.problemList[state.num-1].penImgUrl) {
                            state.penYn = 'Y';
                            $('.problem .penInput #tab1 .inner').html('<img src="' + state.paginationData.problemList[state.num-1].penImgUrl + '">');
                        } else {
                            state.penYn = 'N';
                            $(".problem .tab_content textarea").val(myAnswer).prop('readonly', true);
                            $(".penInput ul.tabs li:last-child").trigger('click');
                        }
                        break;
                    default:
                }
            }
        }
    };
    
    // 년월일시분초 생성
    function yyyymmddhhmmss() {
        var d = new Date();
        
        var yyyy = d.getFullYear();
        var mm = d.getMonth() < 9 ? "0" + (d.getMonth() + 1) : (d.getMonth() + 1);
        var dd  = d.getDate() < 10 ? "0" + d.getDate() : d.getDate();
        var hh = d.getHours() < 10 ? "0" + d.getHours() : d.getHours();
        var min = d.getMinutes() < 10 ? "0" + d.getMinutes() : d.getMinutes();
        var ss = d.getSeconds() < 10 ? "0" + d.getSeconds() : d.getSeconds();
        return "".concat(yyyy).concat(mm).concat(dd).concat(hh).concat(min).concat(ss);
    };
    
    // 필수유형문제 유형 Tip
    function showTypeTip() {
        // showTypeTip(String contentText, String contentImageUrl)
        var text = null;
        var image = null;
        if(state.paginationData.problemList[state.num-1].typeTipContentType == 'text') {
            text = state.paginationData.problemList[state.num-1].typeTipContent;
        } else if(state.paginationData.problemList[state.num-1].typeTipContentType == 'image') {
            image = state.paginationData.problemList[state.num-1].typeTipContent;
        }
        window['android'].showTypeTip(text, image);
    }
    
    // 정답 확인 팝업
    function showCheckTheAnswer() {
        state.isShowAnswer = !state.isShowAnswer;
        window['android'].showCheckTheAnswer();
    }
    
    // 최종 결과확인
    function showResult() {
        console.log('맞힌문제 : ',  state.cntResult[0]);
        console.log('틀린문제 : ',  state.cntResult[1]);
        window['android'].onClickCheckTheResult(state.cntResult[0], state.cntResult[1]);
    }
    
    // 페이지 이동
    function onPageChanged(status) {
        window['android'].onPageChanged(status);
    }
    
    // 음성 시작
    function audioStart(url) {
        $('.problem .voice').removeClass('basic');
        $('.problem .voice').removeClass('paused');
        $('.problem .voice').addClass('playing');
        window['android'].onClickPlayAudio(url);
    }
    
    // 음성 정지
    function audioStop() {
        $('.problem .voice').removeClass('playing');
        $('.problem .voice').removeClass('paused');
        $('.problem .voice').addClass('basic');
        window['android'].onClickStopAudio();
    }
    
    // 음성 일시정지
    function audioPause() {
        $('.problem .voice').removeClass('basic');
        $('.problem .voice').removeClass('playing');
        $('.problem .voice').addClass('paused');
        window['android'].onClickPauseAudio();
    }
    // 음성 재생
    function audioResume() {
        $('.problem .voice').removeClass('basic');
        $('.problem .voice').removeClass('paused');
        $('.problem .voice').addClass('playing');
        window['android'].onClickResumeAudio();
    }
    // 음성 종료
    function audioEnd() {
        $('.problem .voice').addClass('basic');
        $('.problem .voice').removeClass('paused');
        $('.problem .voice').removeClass('playing')
    }
    
    // 풀었던 문제 정답보기
    function showAnswer() {
        if(state.paginationData.problemList[state.num-1]) {
            $('.answer .content .hit').html(state.paginationData.problemList[state.num-1].answer);
            $('.answer .content .desc').html(state.paginationData.problemList[state.num-1].explain);
            if(state.problemData.problemType == '70') $('.answer .content .desc').hide(); // 논술형일 경우 풀이 없음
            if(state.paginationData.problemList[state.num-1].answerRate && state.paginationData.problemList[state.num-1].answerRate != 'null') {
                $('.answer .content .percentage .percent').html(state.paginationData.problemList[state.num-1].answerRate);
            }
            // 문제 유형
            if(state.problemData.problemType == '70') {
                $('.answer .content .score').removeClass('hide');
                
                // 정답, 오답 채점
                switch (state.paginationData.problemList[state.num-1].result) {
                    case '0':
                        $('.right .score .btn[data-state=false]').addClass('on');
                        break;
                    case '2':
                        $('.right .score .btn[data-state=true]').addClass('on');
                        break;
                    default:
                }
            } else {
                // 앱 연동 버튼 노출
                if(state.problemData.videoUrl) $('.answer .content .app .btn-video').removeClass('hide');
                if(state.problemData.listeningNoteUrl) $('.answer .content .app .btn-listen').removeClass('hide');
                if(state.problemData.readingNoteUrl) $('.answer .content .app .btn-checktime').removeClass('hide');
                if(state.problemData.checkTimeUrl) $('.answer .content .app .btn-checktime').removeClass('hide');
                $('.answer .content .app').removeClass('hide');
            }
            
            $('.answer .content').removeClass('hide');
        }
    }
    
    // 로컬스토리지 삭제
    function resetAnswer() {
        localStorage.removeItem('paginationData_' + state.stuId);
        
        return 'success';
    }
    
    function bindEvt() {
        
        // 정답보기 버튼
        $('.btn-answer').on('click', function() {
            state.isShowAnswer = !state.isShowAnswer;
            
            if(state.isShowAnswer) {
                if(!state.doProblem) {
                    // 논술형이면 정답만 확인
                    if(state.problemData.problemType == '70') {
                        getPenAnswer();
                        $('.container').addClass('showanswer');
                        $(this).text('정답 닫기').addClass('open');
                    } else {
                        getAnswer();
                    }
                } else {
                    showAnswer();
                    $('.container').addClass('showanswer');
                    $(this).text('정답 닫기').addClass('open');
                }
            } else {
                $('.container').removeClass('showanswer');
                $(this).text('정답 보기').removeClass('open');
            }
        });
        
        // 나의 답 선택형
        $('.choiceList').on('click', 'li a', function() {
            event.preventDefault();
            if(!state.doProblem) {
                // 문제 답이 여러개일 때
                if(state.problemData.answerCount >= 2) {
                    if($(this).parent('li').hasClass('on')) {
                        $(this).parent('li').removeClass('on');
                    } else {
                        $(this).parent('li').addClass('on');
                    }
                    
                    var myAnswers = [];
                    $('.choiceList li.on').each(function(i){
                        var selectAnswer = $(this).data('answer');
                        myAnswers.push(selectAnswer);
                    })
                    myAnswers = myAnswers.join('/*ROW*/');
                    state.myAnswer = myAnswers;
                    
                    if(!state.myAnswer) {
                        $('.btn-answer').prop('disabled', true);
                    } else {
                        $('.btn-answer').prop('disabled', false);
                    }
                } else {
                    var selectAnswer = $(this).parent('li').data('answer');
                    if(state.myAnswer == selectAnswer) {
                        state.myAnswer = null;
                        $(this).parent('li').removeClass('on');
                        $('.btn-answer').prop('disabled', true);
                    } else {
                        state.myAnswer = selectAnswer;
                        $(this).parent('li').addClass('on').siblings('li').removeClass('on');
                        $('.btn-answer').prop('disabled', false);
                    }
                }
            }
        });
        
        // 나의 답 논술형 탭
        $(".penInput ul.tabs li").click(function () {
            $("ul.tabs li").removeClass("active");
            $(this).addClass("active");
            $(".tab_content").addClass('hide');
            var activeTab = $(this).attr("rel");
            $("#" + activeTab).removeClass('hide');
            
            var tabIdx = $(".penInput ul.tabs li").index(this);
            state.penYn = (tabIdx == 0) ? 'Y' : 'N';
        });
        
        
        // 나의 답 논술형 필기펜 팝업 호출
        $(".penInput .tab_container #tab1").on('click', function() {
            window['android'].onClickPen();
        });
        
        
        // 나의 답 논술형 키보드로 입력
        $(".tab_content textarea").on('keyup input', function() {
            var thisLen = $(this).val().length;
            state.myAnswer = $(this).val();
            if(thisLen > 0) {
                $('.btn-answer').prop('disabled', false);
            } else {
                $('.btn-answer').prop('disabled', true);
            }
        });
        
        
        // 나의 답 단답형
        $('.problem .question').on('keyup input', 'input[type=text]', function() {
            
            var thisIdx = $('.problem .question input[type=text]').index(this);
            state.myAnswerArray[thisIdx] = $(this).val();
            state.myAnswer = state.myAnswerArray.join('/*ROW*/');
            
            var thisLen = $(this).val().length;
            if(thisLen > 0) {
                $(this).addClass('success');
            } else {
                $(this).removeClass('success');
            }
            
            var inputLen = $('.problem .question input[type=text]').length;
            var inputSuccessLen = $('.problem .question input[type=text].success').length;
            
            if(inputLen == inputSuccessLen) {
                $('.btn-answer').prop('disabled', false);
            } else {
                $('.btn-answer').prop('disabled', true);
            }
        });
        
        // 논술형 자가채점
        $('.right .score .btn').on('click', function() {
            if(!state.doProblem) {
                var score = $(this).data('state');
                state.score = score;
                $(this).addClass('on').siblings('.btn').removeClass('on');
                getAnswer();
            }
            
        });
        
        // 음성
        $('.problem .voice').on('click', '.btn-voice', function() {
            if($(this).parent('.voice').hasClass('basic')) {
                $(this).addClass('hide').siblings('.btn-voice').removeClass('hide');
                audioStart(state.audioUrl);
            } else if($(this).parent('.voice').hasClass('playing')) {
                if($(this).hasClass('play')) {
                    audioPause();
                }
                if($(this).hasClass('stop')) {
                    $(this).siblings('.btn-voice').addClass('hide').siblings('.basic').removeClass('hide');
                    audioStop();
                }
            } else if($(this).parent('.voice').hasClass('paused')) {
                if($(this).hasClass('play')) {
                    audioResume();
                }
                if($(this).hasClass('stop')) {
                    $(this).siblings('.btn-voice').addClass('hide').siblings('.basic').removeClass('hide');
                    audioStop();
                }
            }
            
        });
        
        // 앱 연동
        $('.answer .app').on('click', '.btn', function() {
            var status = $(this).data('state');
            switch(status) {
                case 'video':
                    // 해설강의
                    console.log(state.problemData.videoUrl);
                    window['android'].onClickCommentaryLecture(state.problemData.videoUrl);
                    break;
                case 'checktime':
                    // 체크타임
                    console.log(state.problemData.checkTimeUrl);
                    window['android'].onClickCheckTime(state.problemData.checkTimeUrl);
                    break;
                case 'listen':
                    // 리스닝노트
                    console.log(state.problemData.listeningNoteUrl);
                    window['android'].onClickCommentaryLecture(state.problemData.listeningNoteUrl);
                    break;
                case 'read':
                    // 리딩노트
                    console.log(state.problemData.readingNoteUrl);
                    window['android'].onClickReadingNotes(state.problemData.readingNoteUrl);
                    break;
                default:
            }
        });
        
        // 유형 Tip
        $('.btn_tip').on('click', function() {
            showTypeTip();
        });
        
        // input 타겟 설정
        $(document).on('input keyup focus click mousemove', ':input:text', function(e) {
            state.inputTarget = e.target;
            //console.log('target : ', $(e.target));
            //console.log('inputTargetPos : ', $(e.target).getCursorPosition());
        });
    }
    
    /**
     * APP
     */
    // 필기펜 이미지 callback
    function getPenImg(url) {
        console.log('data: ', url);
        if(url) {
            state.penImgUrl = url;
            $('.problem .penInput #tab1 .inner').html('<img src="' + url + '">');
            $('.btn-answer').prop('disabled', false);
        } else {
            state.penImgUrl = '';
            $('.problem .penInput #tab1 .inner').html('');
            $('.btn-answer').prop('disabled', true);
        }
    }
    
    function inputKeypad(str) {
        var prevStr = $(state.inputTarget).val();
        var prevStrArr = prevStr.split('');
        
        
        if(str == '←') { // 지움 키패드
            var inputTargetPos = $(state.inputTarget).getCursorPosition();
            if (inputTargetPos != 0) {
                prevStrArr.splice(inputTargetPos - 1, 1);
                prevStr = prevStrArr.join('');
                $(state.inputTarget).val(prevStr);
                $(state.inputTarget).setCursorPosition(inputTargetPos - 1);
            }
        } else {
            var inputTargetPos = $(state.inputTarget).getCursorPosition();
            prevStrArr.splice(inputTargetPos, 0, str);
            prevStr = prevStrArr.join('');
            $(state.inputTarget).val(prevStr);
            $(state.inputTarget).setCursorPosition(inputTargetPos + 1);
        }
    }
    
    function setLocalStorage () {
    	state.localStorage = JSON.parse(localStorage.getItem('paginationData_' + state.stuId)) || null;
    }
    
    return {
        init: function() {
        	setLocalStorage();
            bindEvt();
            getPagination();
        },
        setSchoolingApiEndpoint : function(schoolingApiEndpoint) {
            state.schoolingApiEndpoint = schoolingApiEndpoint;
        },
        setStudyElmtUid: function(studyElmtUid) {
            state.studyElmtUid = studyElmtUid;
        },
        setPlanServiceUid: function(planServiceUid) {
            state.planServiceUid = planServiceUid;
        },
        setPid: function(pid) {
            state.pid = pid;
        },
        setNum: function(num) {
            state.num = Number(num);
        },
        setFrontSa: function(frontSa) {
            corsHeader['front-sa'] = frontSa;
        },
        moveToProblem: function(problemId, num) {
            moveToProblem(problemId, num);
        },
        getPenImg: function(data) {
            getPenImg(data);
        },
        inputKeypad: function(str) {
            inputKeypad(str);
        },
        setStuId : function (stuId) {
        	state.stuId = stuId;
        },
        showResult: showResult,
        getAnswer: getAnswer,
        audioEnd : audioEnd,
        resetAnser: resetAnswer,
        renderMathJax: renderMathJax
    }
})();

/**
 * @fileoverview dragscroll - scroll area by dragging
 * @version 0.0.8
 * 
 * @license MIT, see http://github.com/asvd/dragscroll
 * @copyright 2015 asvd <heliosframework@gmail.com> 
 */


(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['exports'], factory);
    } else if (typeof exports !== 'undefined') {
        factory(exports);
    } else {
        factory((root.dragscroll = {}));
    }
}(this, function (exports) {
    var _window = window;
    var _document = document;
    var mousemove = 'mousemove';
    var mouseup = 'mouseup';
    var mousedown = 'mousedown';
    var EventListener = 'EventListener';
    var addEventListener = 'add'+EventListener;
    var removeEventListener = 'remove'+EventListener;
    var newScrollX, newScrollY;

    var dragged = [];
    var reset = function(i, el) {
        for (i = 0; i < dragged.length;) {
            el = dragged[i++];
            el = el.container || el;
            el[removeEventListener](mousedown, el.md, 0);
            _window[removeEventListener](mouseup, el.mu, 0);
            _window[removeEventListener](mousemove, el.mm, 0);
        }

        // cloning into array since HTMLCollection is updated dynamically
        dragged = [].slice.call(_document.getElementsByClassName('dragscroll'));
        for (i = 0; i < dragged.length;) {
            (function(el, lastClientX, lastClientY, pushed, scroller, cont){
                (cont = el.container || el)[addEventListener](
                    mousedown,
                    cont.md = function(e) {
                        if (!el.hasAttribute('nochilddrag') ||
                            _document.elementFromPoint(
                                e.pageX, e.pageY
                            ) == cont
                        ) {
                            pushed = 1;
                            lastClientX = e.clientX;
                            lastClientY = e.clientY;

                            e.preventDefault();
                        }
                    }, 0
                );

                _window[addEventListener](
                    mouseup, cont.mu = function() {pushed = 0;}, 0
                );

                _window[addEventListener](
                    mousemove,
                    cont.mm = function(e) {
                        if (pushed) {
                            (scroller = el.scroller||el).scrollLeft -=
                                newScrollX = (- lastClientX + (lastClientX=e.clientX));
                            scroller.scrollTop -=
                                newScrollY = (- lastClientY + (lastClientY=e.clientY));
                            if (el == _document.body) {
                                (scroller = _document.documentElement).scrollLeft -= newScrollX;
                                scroller.scrollTop -= newScrollY;
                            }
                        }
                    }, 0
                );
             })(dragged[i++]);
        }
    }

      
    if (_document.readyState == 'complete') {
        reset();
    } else {
        _window[addEventListener]('load', reset, 0);
    }

    exports.reset = reset;
}));

(function($, undefined) {
    $.fn.getCursorPosition = function() {
        var el = $(this).get(0);
        var pos = 0;
        if ('selectionStart' in el) {
            pos = el.selectionStart;
        } else if ('selection' in document) {
            el.focus();
            var Sel = document.selection.createRange();
            var SelLength = document.selection.createRange().text.length;
            Sel.moveStart('character', -el.value.length);
            pos = Sel.text.length - SelLength;
        }
        return pos;
    }
    $.fn.setCursorPosition = function(pos) {
        this.each(function(index, elem) {
            if (elem.setSelectionRange) {
                elem.setSelectionRange(pos, pos);
            } else if (elem.createTextRange) {
                var range = elem.createTextRange();
                range.collapse(true);
                range.moveEnd('character', pos);
                range.moveStart('character', pos);
                range.select();
            }
        });
        return this;
    };
})(jQuery);
