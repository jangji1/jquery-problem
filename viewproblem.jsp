<%@ page language="java" contentType="text/html; charset=utf-8"
	pageEncoding="utf-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="fmt" uri="http://java.sun.com/jsp/jstl/fmt"%>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions"%>
<html>
<head>
<title>문항 미리보기</title>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" name="viewport">
<link rel="stylesheet" type="text/css" href="/middle/font/font.css?ver=20170905">
<link rel="stylesheet" type="text/css" href="/sigong/common/css/middle/middleproblem.css?ver=20171204_1">
<script type="text/javascript" src="/sigong/common/js/jquery-1.10.2.min.js"></script>
<script type="text/javascript" src="/sigong/common/js/config.js"></script>
<script type="text/javascript" src="/sigong/common/js/common.js"></script>
<script type="text/x-mathjax-config">
	MathJax.Hub.Config({
		"displayAlign": "left",
		"showProcessingMessages": false,
		"messageStyle": "none"
	});
</script>
<script type="text/javascript" src="/sigong/common/js/mathjax/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
<script type="text/javascript" src="/sigong/common/js/makemathjax.js"></script>
<script type="text/javascript" src="/sigong/common/js/middle/renderMathJax.js"></script>
<script type="text/javascript" src="/sigong/common/js/middle/middleproblem.js?ver=20171207"></script>
<script>
    $(window).ready(function () {
        middleProblem.setFrontSa('${frontSa}' || '');
        middleProblem.setSchoolingApiEndpoint('${schoolingApiEndpoint}' || '');
        middleProblem.setStudyElmtUid('${result.studyElmtUid}' || null);
        middleProblem.setPlanServiceUid('${result.planServiceUid}' || null);
        middleProblem.setPid('${result.pid}' || null);
        middleProblem.setNum('${result.num}' || null);
        middleProblem.setStuId('${stuId}' || '0');
        middleProblem.init();
    });
</script>
</head>

<body class="">
	<header class="head">
		<div class="problem_type"><span class="title">거듭제곱으로 나타내기</span><button class="btn btn_tip">유형 Tip</button></div>
	</header>
	<main class="container hide">
		<div class="header"></div>
		<div class="problem">
			<div class="inner">
				<span class="label"></span>
				<span class="voice basic hide">
					<button class="btn btn-voice basic">Basic</button>
					<button class="btn btn-voice play hide">Basic</button>
					<button class="btn btn-voice stop hide">Stop</button>
				</span>
				<div class="question"></div>
				<div class="choiceList"></div>
				<div class="penInput hide">
					<ul class="tabs cf">
				        <li class="active" rel="tab1">필기펜으로 쓰기</li>
				        <li rel="tab2">키보드로 입력하기</li>
				    </ul>
				    <div class="tab_container">
				        <div id="tab1" class="tab_content">
				        	<div class="inner"></div>
				        </div>
				        <div id="tab2" class="tab_content hide">
				        	<div class="inner">
				        		<textarea></textarea>
				        	</div>
				        </div>
				    </div>
				</div>
			</div>
		</div>
		<div class="answer">
			<button class="btn btn-answer" disabled>정답 보기</button>
			<div class="content hide">
				<div class="left">
					<div class="percentage">
						<p class="text">전체 정답률 <span class="percent"></span></p>
					</div>
					<p class="hit"></p>
					<p class="desc"></p>
					<div class="evaluate">
						<p class="text">나의 평가는?</p>
						<ul>
							<li>
								<label class="custom_input"> 쉬웠어요
									<input type="radio" name="evaluate" value="0">
									<span class="radiobtn"></span>
								</label>
								<!-- <label><input type="radio" name="evaluate" value="0" />쉬웠어요</label> -->
							</li>
							<li>
								<label class="custom_input"> 보통이에요
									<input type="radio" name="evaluate" value="1">
									<span class="radiobtn"></span>
								</label>
								<!-- <label><input type="radio" name="evaluate" value="1" />보통이에요</label> -->
							</li>
							<li>
								<label class="custom_input"> 어려웠어요
									<input type="radio" name="evaluate" value="2">
									<span class="radiobtn"></span>
								</label>
								<!-- <label><input type="radio" name="evaluate" value="2" />어려웠어요</label> -->
							</li>
						</ul>
					</div>
				</div>
				<div class="right">
					<div class="score hide">
						<p class="text">자가채점을 해 주세요.</p>
						<button class="btn btn-true" data-state="true">정답 맞음</button>
						<button class="btn btn-false" data-state="false">정답 틀림</button>
					</div>
					<div class="app hide">
						<button class="btn btn-video hide" data-state="video">해설강의</button>
						<button class="btn btn-listen hide" data-state="listen">리스닝 노트</button>
						<button class="btn btn-read hide" data-state="read">리딩노트</button>
						<button class="btn btn-checktime hide" data-state="checktime">체크타임</button>
					</div>
				</div>
			</div>
		</div>
	</main>
	<footer class="footer"></footer>
</body>
</html>
