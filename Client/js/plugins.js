/*! Copyright (c) 2011 Piotr Rochala (http://rocha.la)
 * Dual licensed under the MIT (http://www.opensource.org/licenses/mit-license.php)
 * and GPL (http://www.opensource.org/licenses/gpl-license.php) licenses.
 *
 * Version: 1.3.8
 *
 */
(function ($) {

    $.fn.extend({
        slimScroll: function (options) {

            var defaults = {

                // width in pixels of the visible scroll area
                width: 'auto',

                // height in pixels of the visible scroll area
                height: '250px',

                // width in pixels of the scrollbar and rail
                size: '7px',

                // scrollbar color, accepts any hex/color value
                color: '#000',

                // scrollbar position - left/right
                position: 'right',

                // distance in pixels between the side edge and the scrollbar
                distance: '1px',

                // default scroll position on load - top / bottom / $('selector')
                start: 'top',

                // sets scrollbar opacity
                opacity: .4,

                // enables always-on mode for the scrollbar
                alwaysVisible: false,

                // check if we should hide the scrollbar when user is hovering over
                disableFadeOut: false,

                // sets visibility of the rail
                railVisible: false,

                // sets rail color
                railColor: '#333',

                // sets rail opacity
                railOpacity: .2,

                // whether  we should use jQuery UI Draggable to enable bar dragging
                railDraggable: true,

                // defautlt CSS class of the slimscroll rail
                railClass: 'slimScrollRail',

                // defautlt CSS class of the slimscroll bar
                barClass: 'slimScrollBar',

                // defautlt CSS class of the slimscroll wrapper
                wrapperClass: 'slimScrollDiv',

                // check if mousewheel should scroll the window if we reach top/bottom
                allowPageScroll: false,

                // scroll amount applied to each mouse wheel step
                wheelStep: 20,

                // scroll amount applied when user is using gestures
                touchScrollStep: 200,

                // sets border radius
                borderRadius: '7px',

                // sets border radius of the rail
                railBorderRadius: '7px'
            };

            var o = $.extend(defaults, options);

            // do it for every element that matches selector
            this.each(function () {

                var isOverPanel, isOverBar, isDragg, queueHide, touchDif,
                    barHeight, percentScroll, lastScroll,
                    divS = '<div></div>',
                    minBarHeight = 30,
                    releaseScroll = false;

                // used in event handlers and for better minification
                var me = $(this);

                // ensure we are not binding it again
                if (me.parent().hasClass(o.wrapperClass)) {
                    // start from last bar position
                    var offset = me.scrollTop();

                    // find bar and rail
                    bar = me.siblings('.' + o.barClass);
                    rail = me.siblings('.' + o.railClass);

                    getBarHeight();

                    // check if we should scroll existing instance
                    if ($.isPlainObject(options)) {
                        // Pass height: auto to an existing slimscroll object to force a resize after contents have changed
                        if ('height' in options && options.height == 'auto') {
                            me.parent().css('height', 'auto');
                            me.css('height', 'auto');
                            var height = me.parent().parent().height();
                            me.parent().css('height', height);
                            me.css('height', height);
                        } else if ('height' in options) {
                            var h = options.height;
                            me.parent().css('height', h);
                            me.css('height', h);
                        }

                        if ('scrollTo' in options) {
                            // jump to a static point
                            offset = parseInt(o.scrollTo);
                        } else if ('scrollBy' in options) {
                            // jump by value pixels
                            offset += parseInt(o.scrollBy);
                        } else if ('destroy' in options) {
                            // remove slimscroll elements
                            bar.remove();
                            rail.remove();
                            me.unwrap();
                            return;
                        }

                        // scroll content by the given offset
                        scrollContent(offset, false, true);
                    }

                    return;
                } else if ($.isPlainObject(options)) {
                    if ('destroy' in options) {
                        return;
                    }
                }

                // optionally set height to the parent's height
                o.height = (o.height == 'auto') ? me.parent().height() : o.height;

                // wrap content
                var wrapper = $(divS)
                    .addClass(o.wrapperClass)
                    .css({
                        position: 'relative',
                        overflow: 'hidden',
                        width: o.width,
                        height: o.height
                    });

                // update style for the div
                me.css({
                    overflow: 'hidden',
                    width: o.width,
                    height: o.height
                });

                // create scrollbar rail
                var rail = $(divS)
                    .addClass(o.railClass)
                    .css({
                        width: o.size,
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        display: (o.alwaysVisible && o.railVisible) ? 'block' : 'none',
                        'border-radius': o.railBorderRadius,
                        background: o.railColor,
                        opacity: o.railOpacity,
                        zIndex: 90
                    });

                // create scrollbar
                var bar = $(divS)
                    .addClass(o.barClass)
                    .css({
                        background: o.color,
                        width: o.size,
                        position: 'absolute',
                        top: 0,
                        opacity: o.opacity,
                        display: o.alwaysVisible ? 'block' : 'none',
                        'border-radius': o.borderRadius,
                        BorderRadius: o.borderRadius,
                        MozBorderRadius: o.borderRadius,
                        WebkitBorderRadius: o.borderRadius,
                        zIndex: 99
                    });

                // set position
                var posCss = (o.position == 'right') ? {right: o.distance} : {left: o.distance};
                rail.css(posCss);
                bar.css(posCss);

                // wrap it
                me.wrap(wrapper);

                // append to parent div
                me.parent().append(bar);
                me.parent().append(rail);

                // make it draggable and no longer dependent on the jqueryUI
                if (o.railDraggable) {
                    bar.bind("mousedown", function (e) {
                        var $doc = $(document);
                        isDragg = true;
                        t = parseFloat(bar.css('top'));
                        pageY = e.pageY;

                        $doc.bind("mousemove.slimscroll", function (e) {
                            currTop = t + e.pageY - pageY;
                            bar.css('top', currTop);
                            scrollContent(0, bar.position().top, false);// scroll content
                        });

                        $doc.bind("mouseup.slimscroll", function (e) {
                            isDragg = false;
                            hideBar();
                            $doc.unbind('.slimscroll');
                        });
                        return false;
                    }).bind("selectstart.slimscroll", function (e) {
                        e.stopPropagation();
                        e.preventDefault();
                        return false;
                    });
                }

                // on rail over
                rail.hover(function () {
                    showBar();
                }, function () {
                    hideBar();
                });

                // on bar over
                bar.hover(function () {
                    isOverBar = true;
                }, function () {
                    isOverBar = false;
                });

                // show on parent mouseover
                me.hover(function () {
                    isOverPanel = true;
                    showBar();
                    hideBar();
                }, function () {
                    isOverPanel = false;
                    hideBar();
                });

                // support for mobile
                me.bind('touchstart', function (e, b) {
                    if (e.originalEvent.touches.length) {
                        // record where touch started
                        touchDif = e.originalEvent.touches[0].pageY;
                    }
                });

                me.bind('touchmove', function (e) {
                    // prevent scrolling the page if necessary
                    if (!releaseScroll) {
                        e.originalEvent.preventDefault();
                    }
                    if (e.originalEvent.touches.length) {
                        // see how far user swiped
                        var diff = (touchDif - e.originalEvent.touches[0].pageY) / o.touchScrollStep;
                        // scroll content
                        scrollContent(diff, true);
                        touchDif = e.originalEvent.touches[0].pageY;
                    }
                });

                // set up initial height
                getBarHeight();

                // check start position
                if (o.start === 'bottom') {
                    // scroll content to bottom
                    bar.css({top: me.outerHeight() - bar.outerHeight()});
                    scrollContent(0, true);
                } else if (o.start !== 'top') {
                    // assume jQuery selector
                    scrollContent($(o.start).position().top, null, true);

                    // make sure bar stays hidden
                    if (!o.alwaysVisible) {
                        bar.hide();
                    }
                }

                // attach scroll events
                attachWheel(this);

                function _onWheel(e) {
                    // use mouse wheel only when mouse is over
                    if (!isOverPanel) {
                        return;
                    }

                    var e = e || window.event;

                    var delta = 0;
                    if (e.wheelDelta) {
                        delta = -e.wheelDelta / 120;
                    }
                    if (e.detail) {
                        delta = e.detail / 3;
                    }

                    var target = e.target || e.srcTarget || e.srcElement;
                    if ($(target).closest('.' + o.wrapperClass).is(me.parent())) {
                        // scroll content
                        scrollContent(delta, true);
                    }

                    // stop window scroll
                    if (e.preventDefault && !releaseScroll) {
                        e.preventDefault();
                    }
                    if (!releaseScroll) {
                        e.returnValue = false;
                    }
                }

                function scrollContent(y, isWheel, isJump) {
                    releaseScroll = false;
                    var delta = y;
                    var maxTop = me.outerHeight() - bar.outerHeight();

                    if (isWheel) {
                        // move bar with mouse wheel
                        delta = parseInt(bar.css('top')) + y * parseInt(o.wheelStep) / 100 * bar.outerHeight();

                        // move bar, make sure it doesn't go out
                        delta = Math.min(Math.max(delta, 0), maxTop);

                        // if scrolling down, make sure a fractional change to the
                        // scroll position isn't rounded away when the scrollbar's CSS is set
                        // this flooring of delta would happened automatically when
                        // bar.css is set below, but we floor here for clarity
                        delta = (y > 0) ? Math.ceil(delta) : Math.floor(delta);

                        // scroll the scrollbar
                        bar.css({top: delta + 'px'});
                    }

                    // calculate actual scroll amount
                    percentScroll = parseInt(bar.css('top')) / (me.outerHeight() - bar.outerHeight());
                    delta = percentScroll * (me[0].scrollHeight - me.outerHeight());

                    if (isJump) {
                        delta = y;
                        var offsetTop = delta / me[0].scrollHeight * me.outerHeight();
                        offsetTop = Math.min(Math.max(offsetTop, 0), maxTop);
                        bar.css({top: offsetTop + 'px'});
                    }

                    // scroll content
                    me.scrollTop(delta);

                    // fire scrolling event
                    me.trigger('slimscrolling', ~~delta);

                    // ensure bar is visible
                    showBar();

                    // trigger hide when scroll is stopped
                    hideBar();
                }

                function attachWheel(target) {
                    if (window.addEventListener) {
                        target.addEventListener('DOMMouseScroll', _onWheel, false);
                        target.addEventListener('mousewheel', _onWheel, false);
                    } else {
                        document.attachEvent("onmousewheel", _onWheel)
                    }
                }

                function getBarHeight() {
                    // calculate scrollbar height and make sure it is not too small
                    barHeight = Math.max((me.outerHeight() / me[0].scrollHeight) * me.outerHeight(), minBarHeight);
                    bar.css({height: barHeight + 'px'});

                    // hide scrollbar if content is not long enough
                    var display = barHeight == me.outerHeight() ? 'none' : 'block';
                    bar.css({display: display});
                }

                function showBar() {
                    // recalculate bar height
                    getBarHeight();
                    clearTimeout(queueHide);

                    // when bar reached top or bottom
                    if (percentScroll == ~~percentScroll) {
                        //release wheel
                        releaseScroll = o.allowPageScroll;

                        // publish approporiate event
                        if (lastScroll != percentScroll) {
                            var msg = (~~percentScroll == 0) ? 'top' : 'bottom';
                            me.trigger('slimscroll', msg);
                        }
                    } else {
                        releaseScroll = false;
                    }
                    lastScroll = percentScroll;

                    // show only when required
                    if (barHeight >= me.outerHeight()) {
                        //allow window scroll
                        releaseScroll = true;
                        return;
                    }
                    bar.stop(true, true).fadeIn('fast');
                    if (o.railVisible) {
                        rail.stop(true, true).fadeIn('fast');
                    }
                }

                function hideBar() {
                    // only hide when options allow it
                    if (!o.alwaysVisible) {
                        queueHide = setTimeout(function () {
                            if (!(o.disableFadeOut && isOverPanel) && !isOverBar && !isDragg) {
                                bar.fadeOut('slow');
                                rail.fadeOut('slow');
                            }
                        }, 1000);
                    }
                }

            });

            // maintain chainability
            return this;
        }
    });

    $.fn.extend({
        slimscroll: $.fn.slimScroll
    });

})(jQuery);


(function (e, t) {
    "use strict";

    function n(e) {
        var t = Array.prototype.slice.call(arguments, 1);
        return e.prop ? e.prop.apply(e, t) : e.attr.apply(e, t)
    }

    function s(e, t, n) {
        var s, a;
        for (s in n) n.hasOwnProperty(s) && (a = s.replace(/ |$/g, t.eventNamespace), e.bind(a, n[s]))
    }

    function a(e, t, n) {
        s(e, n, {
            focus: function () {
                t.addClass(n.focusClass)
            }, blur: function () {
                t.removeClass(n.focusClass), t.removeClass(n.activeClass)
            }, mouseenter: function () {
                t.addClass(n.hoverClass)
            }, mouseleave: function () {
                t.removeClass(n.hoverClass), t.removeClass(n.activeClass)
            }, "mousedown touchbegin": function () {
                e.is(":disabled") || t.addClass(n.activeClass)
            }, "mouseup touchend": function () {
                t.removeClass(n.activeClass)
            }
        })
    }

    function i(e, t) {
        e.removeClass(t.hoverClass + " " + t.focusClass + " " + t.activeClass)
    }

    function r(e, t, n) {
        n ? e.addClass(t) : e.removeClass(t)
    }

    function l(e, t, n) {
        var s = "checked", a = t.is(":" + s);
        t.prop ? t.prop(s, a) : a ? t.attr(s, s) : t.removeAttr(s), r(e, n.checkedClass, a)
    }

    function u(e, t, n) {
        r(e, n.disabledClass, t.is(":disabled"))
    }

    function o(e, t, n) {
        switch (n) {
            case"after":
                return e.after(t), e.next();
            case"before":
                return e.before(t), e.prev();
            case"wrap":
                return e.wrap(t), e.parent()
        }
        return null
    }

    function c(t, s, a) {
        var i, r, l;
        return a || (a = {}), a = e.extend({
            bind: {},
            divClass: null,
            divWrap: "wrap",
            spanClass: null,
            spanHtml: null,
            spanWrap: "wrap"
        }, a), i = e("<div />"), r = e("<span />"), s.autoHide && t.is(":hidden") && "none" === t.css("display") && i.hide(), a.divClass && i.addClass(a.divClass), s.wrapperClass && i.addClass(s.wrapperClass), a.spanClass && r.addClass(a.spanClass), l = n(t, "id"), s.useID && l && n(i, "id", s.idPrefix + "-" + l), a.spanHtml && r.html(a.spanHtml), i = o(t, i, a.divWrap), r = o(t, r, a.spanWrap), u(i, t, s), {
            div: i,
            span: r
        }
    }

    function d(t, n) {
        var s;
        return n.wrapperClass ? (s = e("<span />").addClass(n.wrapperClass), s = o(t, s, "wrap")) : null
    }

    function f() {
        var t, n, s, a;
        return a = "rgb(120,2,153)", n = e('<div style="width:0;height:0;color:' + a + '">'), e("body").append(n), s = n.get(0), t = window.getComputedStyle ? window.getComputedStyle(s, "").color : (s.currentStyle || s.style || {}).color, n.remove(), t.replace(/ /g, "") !== a
    }

    function p(t) {
        return t ? e("<span />").text(t).html() : ""
    }

    function m() {
        return navigator.cpuClass && !navigator.product
    }

    function v() {
        return window.XMLHttpRequest !== void 0 ? !0 : !1
    }

    function h(e) {
        var t;
        return e[0].multiple ? !0 : (t = n(e, "size"), !t || 1 >= t ? !1 : !0)
    }

    function C() {
        return !1
    }

    function w(e, t) {
        var n = "none";
        s(e, t, {"selectstart dragstart mousedown": C}), e.css({
            MozUserSelect: n,
            msUserSelect: n,
            webkitUserSelect: n,
            userSelect: n
        })
    }

    function b(e, t, n) {
        var s = e.val();
        "" === s ? s = n.fileDefaultHtml : (s = s.split(/[\/\\]+/), s = s[s.length - 1]), t.text(s)
    }

    function y(e, t, n) {
        var s, a;
        for (s = [], e.each(function () {
            var e;
            for (e in t) Object.prototype.hasOwnProperty.call(t, e) && (s.push({
                el: this,
                name: e,
                old: this.style[e]
            }), this.style[e] = t[e])
        }), n(); s.length;) a = s.pop(), a.el.style[a.name] = a.old
    }

    function g(e, t) {
        var n;
        n = e.parents(), n.push(e[0]), n = n.not(":visible"), y(n, {
            visibility: "hidden",
            display: "block",
            position: "absolute"
        }, t)
    }

    function k(e, t) {
        return function () {
            e.unwrap().unwrap().unbind(t.eventNamespace)
        }
    }

    var H = !0, x = !1, A = [{
        match: function (e) {
            return e.is("a, button, :submit, :reset, input[type='button']")
        }, apply: function (e, t) {
            var r, l, o, d, f;
            return l = t.submitDefaultHtml, e.is(":reset") && (l = t.resetDefaultHtml), d = e.is("a, button") ? function () {
                return e.html() || l
            } : function () {
                return p(n(e, "value")) || l
            }, o = c(e, t, {
                divClass: t.buttonClass,
                spanHtml: d()
            }), r = o.div, a(e, r, t), f = !1, s(r, t, {
                "click touchend": function () {
                    var t, s, a, i;
                    f || e.is(":disabled") || (f = !0, e[0].dispatchEvent ? (t = document.createEvent("MouseEvents"), t.initEvent("click", !0, !0), s = e[0].dispatchEvent(t), e.is("a") && s && (a = n(e, "target"), i = n(e, "href"), a && "_self" !== a ? window.open(i, a) : document.location.href = i)) : e.click(), f = !1)
                }
            }), w(r, t), {
                remove: function () {
                    return r.after(e), r.remove(), e.unbind(t.eventNamespace), e
                }, update: function () {
                    i(r, t), u(r, e, t), e.detach(), o.span.html(d()).append(e)
                }
            }
        }
    }, {
        match: function (e) {
            return e.is(":checkbox")
        }, apply: function (e, t) {
            var n, r, o;
            return n = c(e, t, {divClass: t.checkboxClass}), r = n.div, o = n.span, a(e, r, t), s(e, t, {
                "click touchend": function () {
                    l(o, e, t)
                }
            }), l(o, e, t), {
                remove: k(e, t), update: function () {
                    i(r, t), o.removeClass(t.checkedClass), l(o, e, t), u(r, e, t)
                }
            }
        }
    }, {
        match: function (e) {
            return e.is(":file")
        }, apply: function (t, r) {
            function l() {
                b(t, p, r)
            }

            var d, f, p, v;
            return d = c(t, r, {
                divClass: r.fileClass,
                spanClass: r.fileButtonClass,
                spanHtml: r.fileButtonHtml,
                spanWrap: "after"
            }), f = d.div, v = d.span, p = e("<span />").html(r.fileDefaultHtml), p.addClass(r.filenameClass), p = o(t, p, "after"), n(t, "size") || n(t, "size", f.width() / 10), a(t, f, r), l(), m() ? s(t, r, {
                click: function () {
                    t.trigger("change"), setTimeout(l, 0)
                }
            }) : s(t, r, {change: l}), w(p, r), w(v, r), {
                remove: function () {
                    return p.remove(), v.remove(), t.unwrap().unbind(r.eventNamespace)
                }, update: function () {
                    i(f, r), b(t, p, r), u(f, t, r)
                }
            }
        }
    }, {
        match: function (e) {
            if (e.is("input")) {
                var t = (" " + n(e, "type") + " ").toLowerCase(),
                    s = " color date datetime datetime-local email month number password search tel text time url week ";
                return s.indexOf(t) >= 0
            }
            return !1
        }, apply: function (e, t) {
            var s, i;
            return s = n(e, "type"), e.addClass(t.inputClass), i = d(e, t), a(e, e, t), t.inputAddTypeAsClass && e.addClass(s), {
                remove: function () {
                    e.removeClass(t.inputClass), t.inputAddTypeAsClass && e.removeClass(s), i && e.unwrap()
                }, update: C
            }
        }
    }, {
        match: function (e) {
            return e.is(":radio")
        }, apply: function (t, r) {
            var o, d, f;
            return o = c(t, r, {divClass: r.radioClass}), d = o.div, f = o.span, a(t, d, r), s(t, r, {
                "click touchend": function () {
                    e.uniform.update(e(':radio[name="' + n(t, "name") + '"]'))
                }
            }), l(f, t, r), {
                remove: k(t, r), update: function () {
                    i(d, r), l(f, t, r), u(d, t, r)
                }
            }
        }
    }, {
        match: function (e) {
            return e.is("select") && !h(e) ? !0 : !1
        }, apply: function (t, n) {
            var r, l, o, d;
            return n.selectAutoWidth && g(t, function () {
                d = t.width()
            }), r = c(t, n, {
                divClass: n.selectClass,
                spanHtml: (t.find(":selected:first") || t.find("option:first")).html(),
                spanWrap: "before"
            }), l = r.div, o = r.span, n.selectAutoWidth ? g(t, function () {
                y(e([o[0], l[0]]), {display: "block"}, function () {
                    var e;
                    e = o.outerWidth() - o.width(), l.width(d + e), o.width(d)
                })
            }) : l.addClass("fixedWidth"), a(t, l, n), s(t, n, {
                change: function () {
                    o.html(t.find(":selected").html()), l.removeClass(n.activeClass)
                }, "click touchend": function () {
                    var e = t.find(":selected").html();
                    o.html() !== e && t.trigger("change")
                }, keyup: function () {
                    o.html(t.find(":selected").html())
                }
            }), w(o, n), {
                remove: function () {
                    return o.remove(), t.unwrap().unbind(n.eventNamespace), t
                }, update: function () {
                    n.selectAutoWidth ? (e.uniform.restore(t), t.uniform(n)) : (i(l, n), o.html(t.find(":selected").html()), u(l, t, n))
                }
            }
        }
    }, {
        match: function (e) {
            return e.is("select") && h(e) ? !0 : !1
        }, apply: function (e, t) {
            var n;
            return e.addClass(t.selectMultiClass), n = d(e, t), a(e, e, t), {
                remove: function () {
                    e.removeClass(t.selectMultiClass), n && e.unwrap()
                }, update: C
            }
        }
    }, {
        match: function (e) {
            return e.is("textarea")
        }, apply: function (e, t) {
            var n;
            return e.addClass(t.textareaClass), n = d(e, t), a(e, e, t), {
                remove: function () {
                    e.removeClass(t.textareaClass), n && e.unwrap()
                }, update: C
            }
        }
    }];
    m() && !v() && (H = !1), e.uniform = {
        defaults: {
            activeClass: "active",
            autoHide: !0,
            buttonClass: "button",
            checkboxClass: "checker",
            checkedClass: "checked",
            disabledClass: "disabled",
            eventNamespace: ".uniform",
            fileButtonClass: "action",
            fileButtonHtml: "Choose File",
            fileClass: "uploader",
            fileDefaultHtml: "No file selected",
            filenameClass: "filename",
            focusClass: "focus",
            hoverClass: "hover",
            idPrefix: "uniform",
            inputAddTypeAsClass: !0,
            inputClass: "uniform-input",
            radioClass: "radio",
            resetDefaultHtml: "Reset",
            resetSelector: !1,
            selectAutoWidth: !0,
            selectClass: "selector",
            selectMultiClass: "uniform-multiselect",
            submitDefaultHtml: "Submit",
            textareaClass: "uniform",
            useID: !0,
            wrapperClass: null
        }, elements: []
    }, e.fn.uniform = function (t) {
        var n = this;
        return t = e.extend({}, e.uniform.defaults, t), x || (x = !0, f() && (H = !1)), H ? (t.resetSelector && e(t.resetSelector).mouseup(function () {
            window.setTimeout(function () {
                e.uniform.update(n)
            }, 10)
        }), this.each(function () {
            var n, s, a, i = e(this);
            if (i.data("uniformed")) return e.uniform.update(i), void 0;
            for (n = 0; A.length > n; n += 1) if (s = A[n], s.match(i, t)) return a = s.apply(i, t), i.data("uniformed", a), e.uniform.elements.push(i.get(0)), void 0
        })) : this
    }, e.uniform.restore = e.fn.uniform.restore = function (n) {
        n === t && (n = e.uniform.elements), e(n).each(function () {
            var t, n, s = e(this);
            n = s.data("uniformed"), n && (n.remove(), t = e.inArray(this, e.uniform.elements), t >= 0 && e.uniform.elements.splice(t, 1), s.removeData("uniformed"))
        })
    }, e.uniform.update = e.fn.uniform.update = function (n) {
        n === t && (n = e.uniform.elements), e(n).each(function () {
            var t, n = e(this);
            t = n.data("uniformed"), t && t.update(n, t.options)
        })
    }
})(jQuery);


(function (n) {
    n(["jquery"], function (n) {
        return function () {
            function l(n, t, f) {
                return u({type: r.error, iconClass: i().iconClasses.error, message: n, optionsOverride: f, title: t})
            }

            function a(n, t, f) {
                return u({type: r.info, iconClass: i().iconClasses.info, message: n, optionsOverride: f, title: t})
            }

            function v(n) {
                e = n
            }

            function y(n, t, f) {
                return u({
                    type: r.success,
                    iconClass: i().iconClasses.success,
                    message: n,
                    optionsOverride: f,
                    title: t
                })
            }

            function p(n, t, f) {
                return u({
                    type: r.warning,
                    iconClass: i().iconClasses.warning,
                    message: n,
                    optionsOverride: f,
                    title: t
                })
            }

            function w(r) {
                var u = i();
                if (t || f(u), r && n(":focus", r).length === 0) {
                    r[u.hideMethod]({
                        duration: u.hideDuration, easing: u.hideEasing, complete: function () {
                            c(r)
                        }
                    });
                    return
                }
                t.children().length && t[u.hideMethod]({
                    duration: u.hideDuration,
                    easing: u.hideEasing,
                    complete: function () {
                        t.remove()
                    }
                })
            }

            function b() {
                return {
                    tapToDismiss: !0,
                    toastClass: "toast",
                    containerId: "toast-container",
                    debug: !1,
                    showMethod: "fadeIn",
                    showDuration: 300,
                    showEasing: "swing",
                    onShown: undefined,
                    hideMethod: "fadeOut",
                    hideDuration: 1e3,
                    hideEasing: "swing",
                    onHidden: undefined,
                    extendedTimeOut: 1e3,
                    iconClasses: {
                        error: "toast-error",
                        info: "toast-info",
                        success: "toast-success",
                        warning: "toast-warning"
                    },
                    iconClass: "toast-info",
                    positionClass: "toast-top-right",
                    timeOut: 5e3,
                    titleClass: "toast-title",
                    messageClass: "toast-message",
                    target: "body",
                    closeHtml: "<button>&times;<\/button>",
                    newestOnTop: !0
                }
            }

            function h(n) {
                e && e(n)
            }

            function u(r) {
                function l(t) {
                    if (!n(":focus", e).length || t) return e[u.hideMethod]({
                        duration: u.hideDuration,
                        easing: u.hideEasing,
                        complete: function () {
                            c(e), u.onHidden && u.onHidden(), s.state = "hidden", s.endTime = new Date, h(s)
                        }
                    })
                }

                function b() {
                    (u.timeOut > 0 || u.extendedTimeOut > 0) && (y = setTimeout(l, u.extendedTimeOut))
                }

                function k() {
                    clearTimeout(y), e.stop(!0, !0)[u.showMethod]({duration: u.showDuration, easing: u.showEasing})
                }

                var u = i(), v = r.iconClass || u.iconClass;
                typeof r.optionsOverride != "undefined" && (u = n.extend(u, r.optionsOverride), v = r.optionsOverride.iconClass || v), o++, t = f(u);
                var y = null, e = n("<div/>"), p = n("<div/>"), w = n("<div/>"), a = n(u.closeHtml),
                    s = {toastId: o, state: "visible", startTime: new Date, options: u, map: r};
                return r.iconClass && e.addClass(u.toastClass).addClass(v), r.title && (p.append(r.title).addClass(u.titleClass), e.append(p)), r.message && (w.append(r.message).addClass(u.messageClass), e.append(w)), u.closeButton && (a.addClass("toast-close-button"), e.prepend(a)), e.hide(), u.newestOnTop ? t.prepend(e) : t.append(e), e[u.showMethod]({
                    duration: u.showDuration,
                    easing: u.showEasing,
                    complete: u.onShown
                }), u.timeOut > 0 && (y = setTimeout(l, u.timeOut)), e.hover(k, b), !u.onclick && u.tapToDismiss && e.click(l), u.closeButton && a && a.click(function (n) {
                    n.stopPropagation(), l(!0)
                }), u.onclick && e.click(function () {
                    u.onclick(), l()
                }), h(s), u.debug && console && console.log(s), e
            }

            function f(r) {
                return (r || (r = i()), t = n("#" + r.containerId), t.length) ? t : (t = n("<div/>").attr("id", r.containerId).addClass(r.positionClass), t.appendTo(n(r.target)), t)
            }

            function i() {
                return n.extend({}, b(), s.options)
            }

            function c(n) {
                (t || (t = f()), n.is(":visible")) || (n.remove(), n = null, t.children().length === 0 && t.remove())
            }

            var t, e, o = 0, r = {error: "error", info: "info", success: "success", warning: "warning"}, s = {
                clear: w,
                error: l,
                getContainer: f,
                info: a,
                options: {},
                subscribe: v,
                success: y,
                version: "2.0.1",
                warning: p
            };
            return s
        }()
    })
})(typeof define == "function" && define.amd ? define : function (n, t) {
    typeof module != "undefined" && module.exports ? module.exports = t(require(n[0])) : window.toastr = t(window.jQuery)
});
//# sourceMappingURL=toastr.min.js.map

/*
 * Fuel UX Spinner
 * https://github.com/ExactTarget/fuelux
 *
 * Copyright (c) 2012 ExactTarget
 * Licensed under the MIT license.
 */

!function (e) {
    var t = function (t, i) {
        this.$element = e(t), this.options = e.extend({}, e.fn.spinner.defaults, i), this.$input = this.$element.find(".spinner-input"), this.$element.on("keyup", this.$input, e.proxy(this.change, this)), this.options.hold ? (this.$element.on("mousedown", ".spinner-up", e.proxy(function () {
            this.startSpin(!0)
        }, this)), this.$element.on("mouseup", ".spinner-up, .spinner-down", e.proxy(this.stopSpin, this)), this.$element.on("mouseout", ".spinner-up, .spinner-down", e.proxy(this.stopSpin, this)), this.$element.on("mousedown", ".spinner-down", e.proxy(function () {
            this.startSpin(!1)
        }, this))) : (this.$element.on("click", ".spinner-up", e.proxy(function () {
            this.step(!0)
        }, this)), this.$element.on("click", ".spinner-down", e.proxy(function () {
            this.step(!1)
        }, this))), this.switches = {
            count: 1,
            enabled: !0
        }, this.switches.speed = "medium" === this.options.speed ? 300 : "fast" === this.options.speed ? 100 : 500, this.lastValue = null, this.render(), this.options.disabled && this.disable()
    };
    t.prototype = {
        constructor: t, render: function () {
            var e = this.$input.val();
            e ? this.value(e) : this.$input.val(this.options.value), this.$input.attr("maxlength", (this.options.max + "").split("").length)
        }, change: function () {
            var e = this.$input.val();
            e / 1 ? this.options.value = e / 1 : (e = e.replace(/[^0-9]/g, ""), this.$input.val(e), this.options.value = e / 1), this.triggerChangedEvent()
        }, stopSpin: function () {
            clearTimeout(this.switches.timeout), this.switches.count = 1, this.triggerChangedEvent()
        }, triggerChangedEvent: function () {
            var e = this.value();
            e !== this.lastValue && (this.lastValue = e, this.$element.trigger("changed", e), this.$element.trigger("change"))
        }, startSpin: function (t) {
            if (!this.options.disabled) {
                var i = this.switches.count;
                1 === i ? (this.step(t), i = 1) : i = 3 > i ? 1.5 : 8 > i ? 2.5 : 4, this.switches.timeout = setTimeout(e.proxy(function () {
                    this.iterator(t)
                }, this), this.switches.speed / i), this.switches.count++
            }
        }, iterator: function (e) {
            this.step(e), this.startSpin(e)
        }, step: function (e) {
            var t = this.options.value, i = e ? this.options.max : this.options.min;
            if (e ? i > t : t > i) {
                var s = t + (e ? 1 : -1) * this.options.step;
                (e ? s > i : i > s) ? this.value(i) : this.value(s)
            } else if (this.options.cycle) {
                var n = e ? this.options.min : this.options.max;
                this.value(n)
            }
        }, value: function (e) {
            return !isNaN(parseFloat(e)) && isFinite(e) ? (e = parseFloat(e), this.options.value = e, this.$input.val(e), this) : this.options.value
        }, disable: function () {
            this.options.disabled = !0, this.$input.attr("disabled", ""), this.$element.find("button").addClass("disabled")
        }, enable: function () {
            this.options.disabled = !1, this.$input.removeAttr("disabled"), this.$element.find("button").removeClass("disabled")
        }
    }, e.fn.spinner = function (i, s) {
        var n, a = this.each(function () {
            var a = e(this), o = a.data("spinner"), r = "object" == typeof i && i;
            o || a.data("spinner", o = new t(this, r)), "string" == typeof i && (n = o[i](s))
        });
        return void 0 === n ? a : n
    }, e.fn.spinner.defaults = {
        value: 1,
        min: 1,
        max: 999,
        step: 1,
        hold: !0,
        speed: "medium",
        disabled: !1
    }, e.fn.spinner.Constructor = t, e(function () {
        e("body").on("mousedown.spinner.data-api", ".spinner", function () {
            var t = e(this);
            t.data("spinner") || t.spinner(t.data())
        })
    })
}(window.jQuery);


!function (t, e) {
    "use strict";
    "function" == typeof define && define.amd ? define(["jquery"], e) : "object" == typeof exports ? module.exports = e(require("jquery")) : t.bootbox = e(t.jQuery)
}(this, function e(p, u) {
    "use strict";
    var r, n, i, l;
    Object.keys || (Object.keys = (r = Object.prototype.hasOwnProperty, n = !{toString: null}.propertyIsEnumerable("toString"), l = (i = ["toString", "toLocaleString", "valueOf", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "constructor"]).length, function (t) {
        if ("function" != typeof t && ("object" != typeof t || null === t)) throw new TypeError("Object.keys called on non-object");
        var e, o, a = [];
        for (e in t) r.call(t, e) && a.push(e);
        if (n) for (o = 0; o < l; o++) r.call(t, i[o]) && a.push(i[o]);
        return a
    }));
    var d = {};
    d.VERSION = "5.0.0";
    var b = {en: {OK: "OK", CANCEL: "Cancel", CONFIRM: "OK"}}, f = {
        dialog: '<div class="bootbox modal" tabindex="-1" role="dialog" aria-hidden="true"><div class="modal-dialog"><div class="modal-content"><div class="modal-body"><div class="bootbox-body"></div></div></div></div></div>',
        header: '<div class="modal-header"><h5 class="modal-title"></h5></div>',
        footer: '<div class="modal-footer"></div>',
        closeButton: '<button type="button" class="bootbox-close-button close" aria-hidden="true">&times;</button>',
        form: '<form class="bootbox-form"></form>',
        button: '<button type="button" class="btn"></button>',
        option: "<option></option>",
        promptMessage: '<div class="bootbox-prompt-message"></div>',
        inputs: {
            text: '<input class="bootbox-input bootbox-input-text form-control" autocomplete="off" type="text" />',
            textarea: '<textarea class="bootbox-input bootbox-input-textarea form-control"></textarea>',
            email: '<input class="bootbox-input bootbox-input-email form-control" autocomplete="off" type="email" />',
            select: '<select class="bootbox-input bootbox-input-select form-control"></select>',
            checkbox: '<div class="form-check checkbox"><label class="form-check-label"><input class="form-check-input bootbox-input bootbox-input-checkbox" type="checkbox" /></label></div>',
            radio: '<div class="form-check radio"><label class="form-check-label"><input class="form-check-input bootbox-input bootbox-input-radio" type="radio" name="bootbox-radio" /></label></div>',
            date: '<input class="bootbox-input bootbox-input-date form-control" autocomplete="off" type="date" />',
            time: '<input class="bootbox-input bootbox-input-time form-control" autocomplete="off" type="time" />',
            number: '<input class="bootbox-input bootbox-input-number form-control" autocomplete="off" type="number" />',
            password: '<input class="bootbox-input bootbox-input-password form-control" autocomplete="off" type="password" />',
            range: '<input class="bootbox-input bootbox-input-range form-control-range" autocomplete="off" type="range" />'
        }
    }, m = {
        locale: "en",
        backdrop: "static",
        animate: !0,
        className: null,
        closeButton: !0,
        show: !0,
        container: "body",
        value: "",
        inputType: "text",
        swapButtonOrder: !1,
        centerVertical: !1,
        multiple: !1,
        scrollable: !1
    };

    function c(t, e, o) {
        return p.extend(!0, {}, t, function (t, e) {
            var o = t.length, a = {};
            if (o < 1 || 2 < o) throw new Error("Invalid argument length");
            return 2 === o || "string" == typeof t[0] ? (a[e[0]] = t[0], a[e[1]] = t[1]) : a = t[0], a
        }(e, o))
    }

    function h(t, e, o, a) {
        var r;
        a && a[0] && (r = a[0].locale || m.locale, (a[0].swapButtonOrder || m.swapButtonOrder) && (e = e.reverse()));
        var n, i, l, s = {
            className: "bootbox-" + t, buttons: function (t, e) {
                for (var o = {}, a = 0, r = t.length; a < r; a++) {
                    var n = t[a], i = n.toLowerCase(), l = n.toUpperCase();
                    o[i] = {label: (s = l, (c = b[e]) ? c[s] : b.en[s])}
                }
                var s, c;
                return o
            }(e, r)
        };
        return n = c(s, a, o), l = {}, v(i = e, function (t, e) {
            l[e] = !0
        }), v(n.buttons, function (t) {
            if (l[t] === u) throw new Error('button key "' + t + '" is not allowed (options are ' + i.join(" ") + ")")
        }), n
    }

    function w(t) {
        return Object.keys(t).length
    }

    function v(t, o) {
        var a = 0;
        p.each(t, function (t, e) {
            o(t, e, a++)
        })
    }

    function g(t) {
        t.data.dialog.find(".bootbox-accept").first().trigger("focus")
    }

    function y(t) {
        t.target === t.data.dialog[0] && t.data.dialog.remove()
    }

    function x(t) {
        t.target === t.data.dialog[0] && (t.data.dialog.off("escape.close.bb"), t.data.dialog.off("click"))
    }

    function k(t, e, o) {
        t.stopPropagation(), t.preventDefault(), p.isFunction(o) && !1 === o.call(e, t) || e.modal("hide")
    }

    function E(t) {
        return /([01][0-9]|2[0-3]):[0-5][0-9]?:[0-5][0-9]/.test(t)
    }

    function O(t) {
        return /(\d{4})-(\d{2})-(\d{2})/.test(t)
    }

    return d.locales = function (t) {
        return t ? b[t] : b
    }, d.addLocale = function (t, o) {
        return p.each(["OK", "CANCEL", "CONFIRM"], function (t, e) {
            if (!o[e]) throw new Error('Please supply a translation for "' + e + '"')
        }), b[t] = {OK: o.OK, CANCEL: o.CANCEL, CONFIRM: o.CONFIRM}, d
    }, d.removeLocale = function (t) {
        if ("en" === t) throw new Error('"en" is used as the default and fallback locale and cannot be removed.');
        return delete b[t], d
    }, d.setLocale = function (t) {
        return d.setDefaults("locale", t)
    }, d.setDefaults = function () {
        var t = {};
        return 2 === arguments.length ? t[arguments[0]] = arguments[1] : t = arguments[0], p.extend(m, t), d
    }, d.hideAll = function () {
        return p(".bootbox").modal("hide"), d
    }, d.init = function (t) {
        return e(t || p)
    }, d.dialog = function (t) {
        if (p.fn.modal === u) throw new Error('"$.fn.modal" is not defined; please double check you have included the Bootstrap JavaScript library. See https://getbootstrap.com/docs/4.4/getting-started/javascript/ for more details.');
        if (t = function (r) {
            var n, i;
            if ("object" != typeof r) throw new Error("Please supply an object of options");
            if (!r.message) throw new Error('"message" option must not be null or an empty string.');
            (r = p.extend({}, m, r)).buttons || (r.buttons = {});
            return n = r.buttons, i = w(n), v(n, function (t, e, o) {
                if (p.isFunction(e) && (e = n[t] = {callback: e}), "object" !== p.type(e)) throw new Error('button with key "' + t + '" must be an object');
                if (e.label || (e.label = t), !e.className) {
                    var a = !1;
                    a = r.swapButtonOrder ? 0 === o : o === i - 1, e.className = i <= 2 && a ? "btn-primary" : "btn-secondary btn-default"
                }
            }), r
        }(t), p.fn.modal.Constructor.VERSION) {
            t.fullBootstrapVersion = p.fn.modal.Constructor.VERSION;
            var e = t.fullBootstrapVersion.indexOf(".");
            t.bootstrap = t.fullBootstrapVersion.substring(0, e)
        } else t.bootstrap = "2", t.fullBootstrapVersion = "2.3.2", console.warn("Bootbox will *mostly* work with Bootstrap 2, but we do not officially support it. Please upgrade, if possible.");
        var o = p(f.dialog), a = o.find(".modal-dialog"), r = o.find(".modal-body"), n = p(f.header), i = p(f.footer),
            l = t.buttons, s = {onEscape: t.onEscape};
        if (r.find(".bootbox-body").html(t.message), 0 < w(t.buttons) && (v(l, function (t, e) {
            var o = p(f.button);
            switch (o.data("bb-handler", t), o.addClass(e.className), t) {
                case"ok":
                case"confirm":
                    o.addClass("bootbox-accept");
                    break;
                case"cancel":
                    o.addClass("bootbox-cancel")
            }
            o.html(e.label), i.append(o), s[t] = e.callback
        }), r.after(i)), !0 === t.animate && o.addClass("fade"), t.className && o.addClass(t.className), t.size) switch (t.fullBootstrapVersion.substring(0, 3) < "3.1" && console.warn('"size" requires Bootstrap 3.1.0 or higher. You appear to be using ' + t.fullBootstrapVersion + ". Please upgrade to use this option."), t.size) {
            case"small":
            case"sm":
                a.addClass("modal-sm");
                break;
            case"large":
            case"lg":
                a.addClass("modal-lg");
                break;
            case"extra-large":
            case"xl":
                a.addClass("modal-xl"), t.fullBootstrapVersion.substring(0, 3) < "4.2" && console.warn('Using size "xl"/"extra-large" requires Bootstrap 4.2.0 or higher. You appear to be using ' + t.fullBootstrapVersion + ". Please upgrade to use this option.")
        }
        if (t.scrollable && (a.addClass("modal-dialog-scrollable"), t.fullBootstrapVersion.substring(0, 3) < "4.3" && console.warn('Using "scrollable" requires Bootstrap 4.3.0 or higher. You appear to be using ' + t.fullBootstrapVersion + ". Please upgrade to use this option.")), t.title && (r.before(n), o.find(".modal-title").html(t.title)), t.closeButton) {
            var c = p(f.closeButton);
            t.title ? 3 < t.bootstrap ? o.find(".modal-header").append(c) : o.find(".modal-header").prepend(c) : c.prependTo(r)
        }
        if (t.centerVertical && (a.addClass("modal-dialog-centered"), t.fullBootstrapVersion < "4.0.0" && console.warn('"centerVertical" requires Bootstrap 4.0.0-beta.3 or higher. You appear to be using ' + t.fullBootstrapVersion + ". Please upgrade to use this option.")), o.one("hide.bs.modal", {dialog: o}, x), t.onHide) {
            if (!p.isFunction(t.onHide)) throw new Error('Argument supplied to "onHide" must be a function');
            o.on("hide.bs.modal", t.onHide)
        }
        if (o.one("hidden.bs.modal", {dialog: o}, y), t.onHidden) {
            if (!p.isFunction(t.onHidden)) throw new Error('Argument supplied to "onHidden" must be a function');
            o.on("hidden.bs.modal", t.onHidden)
        }
        if (t.onShow) {
            if (!p.isFunction(t.onShow)) throw new Error('Argument supplied to "onShow" must be a function');
            o.on("show.bs.modal", t.onShow)
        }
        if (o.one("shown.bs.modal", {dialog: o}, g), t.onShown) {
            if (!p.isFunction(t.onShown)) throw new Error('Argument supplied to "onShown" must be a function');
            o.on("shown.bs.modal", t.onShown)
        }
        return "static" !== t.backdrop && o.on("click.dismiss.bs.modal", function (t) {
            o.children(".modal-backdrop").length && (t.currentTarget = o.children(".modal-backdrop").get(0)), t.target === t.currentTarget && o.trigger("escape.close.bb")
        }), o.on("escape.close.bb", function (t) {
            s.onEscape && k(t, o, s.onEscape)
        }), o.on("click", ".modal-footer button:not(.disabled)", function (t) {
            var e = p(this).data("bb-handler");
            e !== u && k(t, o, s[e])
        }), o.on("click", ".bootbox-close-button", function (t) {
            k(t, o, s.onEscape)
        }), o.on("keyup", function (t) {
            27 === t.which && o.trigger("escape.close.bb")
        }), p(t.container).append(o), o.modal({
            backdrop: !!t.backdrop && "static",
            keyboard: !1,
            show: !1
        }), t.show && o.modal("show"), o
    }, d.alert = function () {
        var t;
        if ((t = h("alert", ["ok"], ["message", "callback"], arguments)).callback && !p.isFunction(t.callback)) throw new Error('alert requires the "callback" property to be a function when provided');
        return t.buttons.ok.callback = t.onEscape = function () {
            return !p.isFunction(t.callback) || t.callback.call(this)
        }, d.dialog(t)
    }, d.confirm = function () {
        var t;
        if (t = h("confirm", ["cancel", "confirm"], ["message", "callback"], arguments), !p.isFunction(t.callback)) throw new Error("confirm requires a callback");
        return t.buttons.cancel.callback = t.onEscape = function () {
            return t.callback.call(this, !1)
        }, t.buttons.confirm.callback = function () {
            return t.callback.call(this, !0)
        }, d.dialog(t)
    }, d.prompt = function () {
        var r, e, t, n, o, a;
        if (t = p(f.form), (r = h("prompt", ["cancel", "confirm"], ["title", "callback"], arguments)).value || (r.value = m.value), r.inputType || (r.inputType = m.inputType), o = r.show === u ? m.show : r.show, r.show = !1, r.buttons.cancel.callback = r.onEscape = function () {
            return r.callback.call(this, null)
        }, r.buttons.confirm.callback = function () {
            var t;
            if ("checkbox" === r.inputType) t = n.find("input:checked").map(function () {
                return p(this).val()
            }).get(); else if ("radio" === r.inputType) t = n.find("input:checked").val(); else {
                if (n[0].checkValidity && !n[0].checkValidity()) return !1;
                t = "select" === r.inputType && !0 === r.multiple ? n.find("option:selected").map(function () {
                    return p(this).val()
                }).get() : n.val()
            }
            return r.callback.call(this, t)
        }, !r.title) throw new Error("prompt requires a title");
        if (!p.isFunction(r.callback)) throw new Error("prompt requires a callback");
        if (!f.inputs[r.inputType]) throw new Error("Invalid prompt type");
        switch (n = p(f.inputs[r.inputType]), r.inputType) {
            case"text":
            case"textarea":
            case"email":
            case"password":
                n.val(r.value), r.placeholder && n.attr("placeholder", r.placeholder), r.pattern && n.attr("pattern", r.pattern), r.maxlength && n.attr("maxlength", r.maxlength), r.required && n.prop({required: !0}), r.rows && !isNaN(parseInt(r.rows)) && "textarea" === r.inputType && n.attr({rows: r.rows});
                break;
            case"date":
            case"time":
            case"number":
            case"range":
                if (n.val(r.value), r.placeholder && n.attr("placeholder", r.placeholder), r.pattern && n.attr("pattern", r.pattern), r.required && n.prop({required: !0}), "date" !== r.inputType && r.step) {
                    if (!("any" === r.step || !isNaN(r.step) && 0 < parseFloat(r.step))) throw new Error('"step" must be a valid positive number or the value "any". See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-step for more information.');
                    n.attr("step", r.step)
                }
                !function (t, e, o) {
                    var a = !1, r = !0, n = !0;
                    if ("date" === t) e === u || (r = O(e)) ? o === u || (n = O(o)) || console.warn('Browsers which natively support the "date" input type expect date values to be of the form "YYYY-MM-DD" (see ISO-8601 https://www.iso.org/iso-8601-date-and-time-format.html). Bootbox does not enforce this rule, but your max value may not be enforced by this browser.') : console.warn('Browsers which natively support the "date" input type expect date values to be of the form "YYYY-MM-DD" (see ISO-8601 https://www.iso.org/iso-8601-date-and-time-format.html). Bootbox does not enforce this rule, but your min value may not be enforced by this browser.'); else if ("time" === t) {
                        if (e !== u && !(r = E(e))) throw new Error('"min" is not a valid time. See https://www.w3.org/TR/2012/WD-html-markup-20120315/datatypes.html#form.data.time for more information.');
                        if (o !== u && !(n = E(o))) throw new Error('"max" is not a valid time. See https://www.w3.org/TR/2012/WD-html-markup-20120315/datatypes.html#form.data.time for more information.')
                    } else {
                        if (e !== u && isNaN(e)) throw r = !1, new Error('"min" must be a valid number. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-min for more information.');
                        if (o !== u && isNaN(o)) throw n = !1, new Error('"max" must be a valid number. See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-max for more information.')
                    }
                    if (r && n) {
                        if (o <= e) throw new Error('"max" must be greater than "min". See https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-max for more information.');
                        a = !0
                    }
                    return a
                }(r.inputType, r.min, r.max) || (r.min !== u && n.attr("min", r.min), r.max !== u && n.attr("max", r.max));
                break;
            case"select":
                var i = {};
                if (a = r.inputOptions || [], !p.isArray(a)) throw new Error("Please pass an array of input options");
                if (!a.length) throw new Error('prompt with "inputType" set to "select" requires at least one option');
                r.placeholder && n.attr("placeholder", r.placeholder), r.required && n.prop({required: !0}), r.multiple && n.prop({multiple: !0}), v(a, function (t, e) {
                    var o = n;
                    if (e.value === u || e.text === u) throw new Error('each option needs a "value" property and a "text" property');
                    e.group && (i[e.group] || (i[e.group] = p("<optgroup />").attr("label", e.group)), o = i[e.group]);
                    var a = p(f.option);
                    a.attr("value", e.value).text(e.text), o.append(a)
                }), v(i, function (t, e) {
                    n.append(e)
                }), n.val(r.value);
                break;
            case"checkbox":
                var l = p.isArray(r.value) ? r.value : [r.value];
                if (!(a = r.inputOptions || []).length) throw new Error('prompt with "inputType" set to "checkbox" requires at least one option');
                n = p('<div class="bootbox-checkbox-list"></div>'), v(a, function (t, o) {
                    if (o.value === u || o.text === u) throw new Error('each option needs a "value" property and a "text" property');
                    var a = p(f.inputs[r.inputType]);
                    a.find("input").attr("value", o.value), a.find("label").append("\n" + o.text), v(l, function (t, e) {
                        e === o.value && a.find("input").prop("checked", !0)
                    }), n.append(a)
                });
                break;
            case"radio":
                if (r.value !== u && p.isArray(r.value)) throw new Error('prompt with "inputType" set to "radio" requires a single, non-array value for "value"');
                if (!(a = r.inputOptions || []).length) throw new Error('prompt with "inputType" set to "radio" requires at least one option');
                n = p('<div class="bootbox-radiobutton-list"></div>');
                var s = !0;
                v(a, function (t, e) {
                    if (e.value === u || e.text === u) throw new Error('each option needs a "value" property and a "text" property');
                    var o = p(f.inputs[r.inputType]);
                    o.find("input").attr("value", e.value), o.find("label").append("\n" + e.text), r.value !== u && e.value === r.value && (o.find("input").prop("checked", !0), s = !1), n.append(o)
                }), s && n.find('input[type="radio"]').first().prop("checked", !0)
        }
        if (t.append(n), t.on("submit", function (t) {
            t.preventDefault(), t.stopPropagation(), e.find(".bootbox-accept").trigger("click")
        }), "" !== p.trim(r.message)) {
            var c = p(f.promptMessage).html(r.message);
            t.prepend(c), r.message = t
        } else r.message = t;
        return (e = d.dialog(r)).off("shown.bs.modal", g), e.on("shown.bs.modal", function () {
            n.focus()
        }), !0 === o && e.modal("show"), e
    }, d
});


/*!
 * Bootstrap-select v1.13.9 (https://developer.snapappointments.com/bootstrap-select)
 *
 * Copyright 2012-2019 SnapAppointments, LLC
 * Licensed under MIT (https://github.com/snapappointments/bootstrap-select/blob/master/LICENSE)
 */

!function (e, t) {
    void 0 === e && void 0 !== window && (e = window), "function" == typeof define && define.amd ? define(["jquery"], function (e) {
        return t(e)
    }) : "object" == typeof module && module.exports ? module.exports = t(require("jquery")) : t(e.jQuery)
}(this, function (e) {
    !function (z) {
        "use strict";
        var d = ["sanitize", "whiteList", "sanitizeFn"],
            l = ["background", "cite", "href", "itemtype", "longdesc", "poster", "src", "xlink:href"], e = {
                "*": ["class", "dir", "id", "lang", "role", "tabindex", "style", /^aria-[\w-]*$/i],
                a: ["target", "href", "title", "rel"],
                area: [],
                b: [],
                br: [],
                col: [],
                code: [],
                div: [],
                em: [],
                hr: [],
                h1: [],
                h2: [],
                h3: [],
                h4: [],
                h5: [],
                h6: [],
                i: [],
                img: ["src", "alt", "title", "width", "height"],
                li: [],
                ol: [],
                p: [],
                pre: [],
                s: [],
                small: [],
                span: [],
                sub: [],
                sup: [],
                strong: [],
                u: [],
                ul: []
            }, r = /^(?:(?:https?|mailto|ftp|tel|file):|[^&:/?#]*(?:[/?#]|$))/gi,
            a = /^data:(?:image\/(?:bmp|gif|jpeg|jpg|png|tiff|webp)|video\/(?:mpeg|mp4|ogg|webm)|audio\/(?:mp3|oga|ogg|opus));base64,[a-z0-9+/]+=*$/i;

        function v(e, t) {
            var i = e.nodeName.toLowerCase();
            if (-1 !== z.inArray(i, t)) return -1 === z.inArray(i, l) || Boolean(e.nodeValue.match(r) || e.nodeValue.match(a));
            for (var s = z(t).filter(function (e, t) {
                return t instanceof RegExp
            }), n = 0, o = s.length; n < o; n++) if (i.match(s[n])) return !0;
            return !1
        }

        function B(e, t, i) {
            if (i && "function" == typeof i) return i(e);
            for (var s = Object.keys(t), n = 0, o = e.length; n < o; n++) for (var l = e[n].querySelectorAll("*"), r = 0, a = l.length; r < a; r++) {
                var c = l[r], d = c.nodeName.toLowerCase();
                if (-1 !== s.indexOf(d)) for (var h = [].slice.call(c.attributes), p = [].concat(t["*"] || [], t[d] || []), u = 0, f = h.length; u < f; u++) {
                    var m = h[u];
                    v(m, p) || c.removeAttribute(m.nodeName)
                } else c.parentNode.removeChild(c)
            }
        }

        "classList" in document.createElement("_") || function (e) {
            if ("Element" in e) {
                var t = "classList", i = "prototype", s = e.Element[i], n = Object, o = function () {
                    var i = z(this);
                    return {
                        add: function (e) {
                            return e = Array.prototype.slice.call(arguments).join(" "), i.addClass(e)
                        }, remove: function (e) {
                            return e = Array.prototype.slice.call(arguments).join(" "), i.removeClass(e)
                        }, toggle: function (e, t) {
                            return i.toggleClass(e, t)
                        }, contains: function (e) {
                            return i.hasClass(e)
                        }
                    }
                };
                if (n.defineProperty) {
                    var l = {get: o, enumerable: !0, configurable: !0};
                    try {
                        n.defineProperty(s, t, l)
                    } catch (e) {
                        void 0 !== e.number && -2146823252 !== e.number || (l.enumerable = !1, n.defineProperty(s, t, l))
                    }
                } else n[i].__defineGetter__ && s.__defineGetter__(t, o)
            }
        }(window);
        var t, c, i, s = document.createElement("_");
        if (s.classList.add("c1", "c2"), !s.classList.contains("c2")) {
            var n = DOMTokenList.prototype.add, o = DOMTokenList.prototype.remove;
            DOMTokenList.prototype.add = function () {
                Array.prototype.forEach.call(arguments, n.bind(this))
            }, DOMTokenList.prototype.remove = function () {
                Array.prototype.forEach.call(arguments, o.bind(this))
            }
        }
        if (s.classList.toggle("c3", !1), s.classList.contains("c3")) {
            var h = DOMTokenList.prototype.toggle;
            DOMTokenList.prototype.toggle = function (e, t) {
                return 1 in arguments && !this.contains(e) == !t ? t : h.call(this, e)
            }
        }

        function E(e) {
            var t, i = [], s = e.selectedOptions;
            if (e.multiple) for (var n = 0, o = s.length; n < o; n++) t = s[n], i.push(t.value || t.text); else i = e.value;
            return i
        }

        s = null, String.prototype.startsWith || (t = function () {
            try {
                var e = {}, t = Object.defineProperty, i = t(e, e, e) && t
            } catch (e) {
            }
            return i
        }(), c = {}.toString, i = function (e) {
            if (null == this) throw new TypeError;
            var t = String(this);
            if (e && "[object RegExp]" == c.call(e)) throw new TypeError;
            var i = t.length, s = String(e), n = s.length, o = 1 < arguments.length ? arguments[1] : void 0,
                l = o ? Number(o) : 0;
            l != l && (l = 0);
            var r = Math.min(Math.max(l, 0), i);
            if (i < n + r) return !1;
            for (var a = -1; ++a < n;) if (t.charCodeAt(r + a) != s.charCodeAt(a)) return !1;
            return !0
        }, t ? t(String.prototype, "startsWith", {
            value: i,
            configurable: !0,
            writable: !0
        }) : String.prototype.startsWith = i), Object.keys || (Object.keys = function (e, t, i) {
            for (t in i = [], e) i.hasOwnProperty.call(e, t) && i.push(t);
            return i
        }), HTMLSelectElement && !HTMLSelectElement.prototype.hasOwnProperty("selectedOptions") && Object.defineProperty(HTMLSelectElement.prototype, "selectedOptions", {
            get: function () {
                return this.querySelectorAll(":checked")
            }
        });
        var p = {useDefault: !1, _set: z.valHooks.select.set};
        z.valHooks.select.set = function (e, t) {
            return t && !p.useDefault && z(e).data("selected", !0), p._set.apply(this, arguments)
        };
        var C = null, u = function () {
            try {
                return new Event("change"), !0
            } catch (e) {
                return !1
            }
        }();

        function $(e, t, i, s) {
            for (var n = ["display", "subtext", "tokens"], o = !1, l = 0; l < n.length; l++) {
                var r = n[l], a = e[r];
                if (a && (a = a.toString(), "display" === r && (a = a.replace(/<[^>]+>/g, "")), s && (a = w(a)), a = a.toUpperCase(), o = "contains" === i ? 0 <= a.indexOf(t) : a.startsWith(t))) break
            }
            return o
        }

        function L(e) {
            return parseInt(e, 10) || 0
        }

        z.fn.triggerNative = function (e) {
            var t, i = this[0];
            i.dispatchEvent ? (u ? t = new Event(e, {bubbles: !0}) : (t = document.createEvent("Event")).initEvent(e, !0, !1), i.dispatchEvent(t)) : i.fireEvent ? ((t = document.createEventObject()).eventType = e, i.fireEvent("on" + e, t)) : this.trigger(e)
        };
        var f = {
                "\xc0": "A",
                "\xc1": "A",
                "\xc2": "A",
                "\xc3": "A",
                "\xc4": "A",
                "\xc5": "A",
                "\xe0": "a",
                "\xe1": "a",
                "\xe2": "a",
                "\xe3": "a",
                "\xe4": "a",
                "\xe5": "a",
                "\xc7": "C",
                "\xe7": "c",
                "\xd0": "D",
                "\xf0": "d",
                "\xc8": "E",
                "\xc9": "E",
                "\xca": "E",
                "\xcb": "E",
                "\xe8": "e",
                "\xe9": "e",
                "\xea": "e",
                "\xeb": "e",
                "\xcc": "I",
                "\xcd": "I",
                "\xce": "I",
                "\xcf": "I",
                "\xec": "i",
                "\xed": "i",
                "\xee": "i",
                "\xef": "i",
                "\xd1": "N",
                "\xf1": "n",
                "\xd2": "O",
                "\xd3": "O",
                "\xd4": "O",
                "\xd5": "O",
                "\xd6": "O",
                "\xd8": "O",
                "\xf2": "o",
                "\xf3": "o",
                "\xf4": "o",
                "\xf5": "o",
                "\xf6": "o",
                "\xf8": "o",
                "\xd9": "U",
                "\xda": "U",
                "\xdb": "U",
                "\xdc": "U",
                "\xf9": "u",
                "\xfa": "u",
                "\xfb": "u",
                "\xfc": "u",
                "\xdd": "Y",
                "\xfd": "y",
                "\xff": "y",
                "\xc6": "Ae",
                "\xe6": "ae",
                "\xde": "Th",
                "\xfe": "th",
                "\xdf": "ss",
                "\u0100": "A",
                "\u0102": "A",
                "\u0104": "A",
                "\u0101": "a",
                "\u0103": "a",
                "\u0105": "a",
                "\u0106": "C",
                "\u0108": "C",
                "\u010a": "C",
                "\u010c": "C",
                "\u0107": "c",
                "\u0109": "c",
                "\u010b": "c",
                "\u010d": "c",
                "\u010e": "D",
                "\u0110": "D",
                "\u010f": "d",
                "\u0111": "d",
                "\u0112": "E",
                "\u0114": "E",
                "\u0116": "E",
                "\u0118": "E",
                "\u011a": "E",
                "\u0113": "e",
                "\u0115": "e",
                "\u0117": "e",
                "\u0119": "e",
                "\u011b": "e",
                "\u011c": "G",
                "\u011e": "G",
                "\u0120": "G",
                "\u0122": "G",
                "\u011d": "g",
                "\u011f": "g",
                "\u0121": "g",
                "\u0123": "g",
                "\u0124": "H",
                "\u0126": "H",
                "\u0125": "h",
                "\u0127": "h",
                "\u0128": "I",
                "\u012a": "I",
                "\u012c": "I",
                "\u012e": "I",
                "\u0130": "I",
                "\u0129": "i",
                "\u012b": "i",
                "\u012d": "i",
                "\u012f": "i",
                "\u0131": "i",
                "\u0134": "J",
                "\u0135": "j",
                "\u0136": "K",
                "\u0137": "k",
                "\u0138": "k",
                "\u0139": "L",
                "\u013b": "L",
                "\u013d": "L",
                "\u013f": "L",
                "\u0141": "L",
                "\u013a": "l",
                "\u013c": "l",
                "\u013e": "l",
                "\u0140": "l",
                "\u0142": "l",
                "\u0143": "N",
                "\u0145": "N",
                "\u0147": "N",
                "\u014a": "N",
                "\u0144": "n",
                "\u0146": "n",
                "\u0148": "n",
                "\u014b": "n",
                "\u014c": "O",
                "\u014e": "O",
                "\u0150": "O",
                "\u014d": "o",
                "\u014f": "o",
                "\u0151": "o",
                "\u0154": "R",
                "\u0156": "R",
                "\u0158": "R",
                "\u0155": "r",
                "\u0157": "r",
                "\u0159": "r",
                "\u015a": "S",
                "\u015c": "S",
                "\u015e": "S",
                "\u0160": "S",
                "\u015b": "s",
                "\u015d": "s",
                "\u015f": "s",
                "\u0161": "s",
                "\u0162": "T",
                "\u0164": "T",
                "\u0166": "T",
                "\u0163": "t",
                "\u0165": "t",
                "\u0167": "t",
                "\u0168": "U",
                "\u016a": "U",
                "\u016c": "U",
                "\u016e": "U",
                "\u0170": "U",
                "\u0172": "U",
                "\u0169": "u",
                "\u016b": "u",
                "\u016d": "u",
                "\u016f": "u",
                "\u0171": "u",
                "\u0173": "u",
                "\u0174": "W",
                "\u0175": "w",
                "\u0176": "Y",
                "\u0177": "y",
                "\u0178": "Y",
                "\u0179": "Z",
                "\u017b": "Z",
                "\u017d": "Z",
                "\u017a": "z",
                "\u017c": "z",
                "\u017e": "z",
                "\u0132": "IJ",
                "\u0133": "ij",
                "\u0152": "Oe",
                "\u0153": "oe",
                "\u0149": "'n",
                "\u017f": "s"
            }, m = /[\xc0-\xd6\xd8-\xf6\xf8-\xff\u0100-\u017f]/g,
            g = RegExp("[\\u0300-\\u036f\\ufe20-\\ufe2f\\u20d0-\\u20ff\\u1ab0-\\u1aff\\u1dc0-\\u1dff]", "g");

        function b(e) {
            return f[e]
        }

        function w(e) {
            return (e = e.toString()) && e.replace(m, b).replace(g, "")
        }

        var x, I, k, y, S, O = (x = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#x27;",
            "`": "&#x60;"
        }, I = function (e) {
            return x[e]
        }, k = "(?:" + Object.keys(x).join("|") + ")", y = RegExp(k), S = RegExp(k, "g"), function (e) {
            return e = null == e ? "" : "" + e, y.test(e) ? e.replace(S, I) : e
        }), T = {
            32: " ",
            48: "0",
            49: "1",
            50: "2",
            51: "3",
            52: "4",
            53: "5",
            54: "6",
            55: "7",
            56: "8",
            57: "9",
            59: ";",
            65: "A",
            66: "B",
            67: "C",
            68: "D",
            69: "E",
            70: "F",
            71: "G",
            72: "H",
            73: "I",
            74: "J",
            75: "K",
            76: "L",
            77: "M",
            78: "N",
            79: "O",
            80: "P",
            81: "Q",
            82: "R",
            83: "S",
            84: "T",
            85: "U",
            86: "V",
            87: "W",
            88: "X",
            89: "Y",
            90: "Z",
            96: "0",
            97: "1",
            98: "2",
            99: "3",
            100: "4",
            101: "5",
            102: "6",
            103: "7",
            104: "8",
            105: "9"
        }, A = 27, N = 13, D = 32, H = 9, P = 38, W = 40, M = {success: !1, major: "3"};
        try {
            M.full = (z.fn.dropdown.Constructor.VERSION || "").split(" ")[0].split("."), M.major = M.full[0], M.success = !0
        } catch (e) {
        }
        var R = 0, U = ".bs.select", j = {
            DISABLED: "disabled",
            DIVIDER: "divider",
            SHOW: "open",
            DROPUP: "dropup",
            MENU: "dropdown-menu",
            MENURIGHT: "dropdown-menu-right",
            MENULEFT: "dropdown-menu-left",
            BUTTONCLASS: "btn-default",
            POPOVERHEADER: "popover-title",
            ICONBASE: "glyphicon",
            TICKICON: "glyphicon-ok"
        }, V = {MENU: "." + j.MENU}, F = {
            span: document.createElement("span"),
            i: document.createElement("i"),
            subtext: document.createElement("small"),
            a: document.createElement("a"),
            li: document.createElement("li"),
            whitespace: document.createTextNode("\xa0"),
            fragment: document.createDocumentFragment()
        };
        F.a.setAttribute("role", "option"), F.subtext.className = "text-muted", F.text = F.span.cloneNode(!1), F.text.className = "text", F.checkMark = F.span.cloneNode(!1);
        var _ = new RegExp(P + "|" + W), q = new RegExp("^" + H + "$|" + A), G = function (e, t, i) {
            var s = F.li.cloneNode(!1);
            return e && (1 === e.nodeType || 11 === e.nodeType ? s.appendChild(e) : s.innerHTML = e), void 0 !== t && "" !== t && (s.className = t), null != i && s.classList.add("optgroup-" + i), s
        }, K = function (e, t, i) {
            var s = F.a.cloneNode(!0);
            return e && (11 === e.nodeType ? s.appendChild(e) : s.insertAdjacentHTML("beforeend", e)), void 0 !== t && "" !== t && (s.className = t), "4" === M.major && s.classList.add("dropdown-item"), i && s.setAttribute("style", i), s
        }, Y = function (e, t) {
            var i, s, n = F.text.cloneNode(!1);
            if (e.content) n.innerHTML = e.content; else {
                if (n.textContent = e.text, e.icon) {
                    var o = F.whitespace.cloneNode(!1);
                    (s = (!0 === t ? F.i : F.span).cloneNode(!1)).className = e.iconBase + " " + e.icon, F.fragment.appendChild(s), F.fragment.appendChild(o)
                }
                e.subtext && ((i = F.subtext.cloneNode(!1)).textContent = e.subtext, n.appendChild(i))
            }
            if (!0 === t) for (; 0 < n.childNodes.length;) F.fragment.appendChild(n.childNodes[0]); else F.fragment.appendChild(n);
            return F.fragment
        }, Z = function (e) {
            var t, i, s = F.text.cloneNode(!1);
            if (s.innerHTML = e.label, e.icon) {
                var n = F.whitespace.cloneNode(!1);
                (i = F.span.cloneNode(!1)).className = e.iconBase + " " + e.icon, F.fragment.appendChild(i), F.fragment.appendChild(n)
            }
            return e.subtext && ((t = F.subtext.cloneNode(!1)).textContent = e.subtext, s.appendChild(t)), F.fragment.appendChild(s), F.fragment
        }, J = function (e, t) {
            var i = this;
            p.useDefault || (z.valHooks.select.set = p._set, p.useDefault = !0), this.$element = z(e), this.$newElement = null, this.$button = null, this.$menu = null, this.options = t, this.selectpicker = {
                main: {},
                current: {},
                search: {},
                view: {},
                keydown: {
                    keyHistory: "", resetKeyHistory: {
                        start: function () {
                            return setTimeout(function () {
                                i.selectpicker.keydown.keyHistory = ""
                            }, 800)
                        }
                    }
                }
            }, null === this.options.title && (this.options.title = this.$element.attr("title"));
            var s = this.options.windowPadding;
            "number" == typeof s && (this.options.windowPadding = [s, s, s, s]), this.val = J.prototype.val, this.render = J.prototype.render, this.refresh = J.prototype.refresh, this.setStyle = J.prototype.setStyle, this.selectAll = J.prototype.selectAll, this.deselectAll = J.prototype.deselectAll, this.destroy = J.prototype.destroy, this.remove = J.prototype.remove, this.show = J.prototype.show, this.hide = J.prototype.hide, this.init()
        };

        function Q(e) {
            var r, a = arguments, c = e;
            if ([].shift.apply(a), !M.success) {
                try {
                    M.full = (z.fn.dropdown.Constructor.VERSION || "").split(" ")[0].split(".")
                } catch (e) {
                    J.BootstrapVersion ? M.full = J.BootstrapVersion.split(" ")[0].split(".") : (M.full = [M.major, "0", "0"], console.warn("There was an issue retrieving Bootstrap's version. Ensure Bootstrap is being loaded before bootstrap-select and there is no namespace collision. If loading Bootstrap asynchronously, the version may need to be manually specified via $.fn.selectpicker.Constructor.BootstrapVersion.", e))
                }
                M.major = M.full[0], M.success = !0
            }
            if ("4" === M.major) {
                var t = [];
                J.DEFAULTS.style === j.BUTTONCLASS && t.push({
                    name: "style",
                    className: "BUTTONCLASS"
                }), J.DEFAULTS.iconBase === j.ICONBASE && t.push({
                    name: "iconBase",
                    className: "ICONBASE"
                }), J.DEFAULTS.tickIcon === j.TICKICON && t.push({
                    name: "tickIcon",
                    className: "TICKICON"
                }), j.DIVIDER = "dropdown-divider", j.SHOW = "show", j.BUTTONCLASS = "btn-light", j.POPOVERHEADER = "popover-header", j.ICONBASE = "", j.TICKICON = "bs-ok-default";
                for (var i = 0; i < t.length; i++) {
                    e = t[i];
                    J.DEFAULTS[e.name] = j[e.className]
                }
            }
            var s = this.each(function () {
                var e = z(this);
                if (e.is("select")) {
                    var t = e.data("selectpicker"), i = "object" == typeof c && c;
                    if (t) {
                        if (i) for (var s in i) i.hasOwnProperty(s) && (t.options[s] = i[s])
                    } else {
                        var n = e.data();
                        for (var o in n) n.hasOwnProperty(o) && -1 !== z.inArray(o, d) && delete n[o];
                        var l = z.extend({}, J.DEFAULTS, z.fn.selectpicker.defaults || {}, n, i);
                        l.template = z.extend({}, J.DEFAULTS.template, z.fn.selectpicker.defaults ? z.fn.selectpicker.defaults.template : {}, n.template, i.template), e.data("selectpicker", t = new J(this, l))
                    }
                    "string" == typeof c && (r = t[c] instanceof Function ? t[c].apply(t, a) : t.options[c])
                }
            });
            return void 0 !== r ? r : s
        }

        J.VERSION = "1.13.9", J.DEFAULTS = {
            noneSelectedText: "Nothing selected",
            noneResultsText: "No results matched {0}",
            countSelectedText: function (e, t) {
                return 1 == e ? "{0} item selected" : "{0} items selected"
            },
            maxOptionsText: function (e, t) {
                return [1 == e ? "Limit reached ({n} item max)" : "Limit reached ({n} items max)", 1 == t ? "Group limit reached ({n} item max)" : "Group limit reached ({n} items max)"]
            },
            selectAllText: "Select All",
            deselectAllText: "Deselect All",
            doneButton: !1,
            doneButtonText: "Close",
            multipleSeparator: ", ",
            styleBase: "btn",
            style: j.BUTTONCLASS,
            size: "auto",
            title: null,
            selectedTextFormat: "values",
            width: !1,
            container: !1,
            hideDisabled: !1,
            showSubtext: !1,
            showIcon: !0,
            showContent: !0,
            dropupAuto: !0,
            header: !1,
            liveSearch: !1,
            liveSearchPlaceholder: null,
            liveSearchNormalize: !1,
            liveSearchStyle: "contains",
            actionsBox: !1,
            iconBase: j.ICONBASE,
            tickIcon: j.TICKICON,
            showTick: !1,
            template: {caret: '<span class="caret"></span>'},
            maxOptions: !1,
            mobile: !1,
            selectOnTab: !1,
            dropdownAlignRight: !1,
            windowPadding: 0,
            virtualScroll: 600,
            display: !1,
            sanitize: !0,
            sanitizeFn: null,
            whiteList: e
        }, J.prototype = {
            constructor: J, init: function () {
                var i = this, e = this.$element.attr("id");
                this.selectId = R++, this.$element[0].classList.add("bs-select-hidden"), this.multiple = this.$element.prop("multiple"), this.autofocus = this.$element.prop("autofocus"), this.options.showTick = this.$element[0].classList.contains("show-tick"), this.$newElement = this.createDropdown(), this.$element.after(this.$newElement).prependTo(this.$newElement), this.$button = this.$newElement.children("button"), this.$menu = this.$newElement.children(V.MENU), this.$menuInner = this.$menu.children(".inner"), this.$searchbox = this.$menu.find("input"), this.$element[0].classList.remove("bs-select-hidden"), !0 === this.options.dropdownAlignRight && this.$menu[0].classList.add(j.MENURIGHT), void 0 !== e && this.$button.attr("data-id", e), this.checkDisabled(), this.clickListener(), this.options.liveSearch && this.liveSearchListener(), this.setStyle(), this.render(), this.setWidth(), this.options.container ? this.selectPosition() : this.$element.on("hide" + U, function () {
                    if (i.isVirtual()) {
                        var e = i.$menuInner[0], t = e.firstChild.cloneNode(!1);
                        e.replaceChild(t, e.firstChild), e.scrollTop = 0
                    }
                }), this.$menu.data("this", this), this.$newElement.data("this", this), this.options.mobile && this.mobile(), this.$newElement.on({
                    "hide.bs.dropdown": function (e) {
                        i.$menuInner.attr("aria-expanded", !1), i.$element.trigger("hide" + U, e)
                    }, "hidden.bs.dropdown": function (e) {
                        i.$element.trigger("hidden" + U, e)
                    }, "show.bs.dropdown": function (e) {
                        i.$menuInner.attr("aria-expanded", !0), i.$element.trigger("show" + U, e)
                    }, "shown.bs.dropdown": function (e) {
                        i.$element.trigger("shown" + U, e)
                    }
                }), i.$element[0].hasAttribute("required") && this.$element.on("invalid" + U, function () {
                    i.$button[0].classList.add("bs-invalid"), i.$element.on("shown" + U + ".invalid", function () {
                        i.$element.val(i.$element.val()).off("shown" + U + ".invalid")
                    }).on("rendered" + U, function () {
                        this.validity.valid && i.$button[0].classList.remove("bs-invalid"), i.$element.off("rendered" + U)
                    }), i.$button.on("blur" + U, function () {
                        i.$element.trigger("focus").trigger("blur"), i.$button.off("blur" + U)
                    })
                }), setTimeout(function () {
                    i.createLi(), i.$element.trigger("loaded" + U)
                })
            }, createDropdown: function () {
                var e = this.multiple || this.options.showTick ? " show-tick" : "", t = "",
                    i = this.autofocus ? " autofocus" : "";
                M.major < 4 && this.$element.parent().hasClass("input-group") && (t = " input-group-btn");
                var s, n = "", o = "", l = "", r = "";
                return this.options.header && (n = '<div class="' + j.POPOVERHEADER + '"><button type="button" class="close" aria-hidden="true">&times;</button>' + this.options.header + "</div>"), this.options.liveSearch && (o = '<div class="bs-searchbox"><input type="text" class="form-control" autocomplete="off"' + (null === this.options.liveSearchPlaceholder ? "" : ' placeholder="' + O(this.options.liveSearchPlaceholder) + '"') + ' role="textbox" aria-label="Search"></div>'), this.multiple && this.options.actionsBox && (l = '<div class="bs-actionsbox"><div class="btn-group btn-group-sm btn-block"><button type="button" class="actions-btn bs-select-all btn ' + j.BUTTONCLASS + '">' + this.options.selectAllText + '</button><button type="button" class="actions-btn bs-deselect-all btn ' + j.BUTTONCLASS + '">' + this.options.deselectAllText + "</button></div></div>"), this.multiple && this.options.doneButton && (r = '<div class="bs-donebutton"><div class="btn-group btn-block"><button type="button" class="btn btn-sm ' + j.BUTTONCLASS + '">' + this.options.doneButtonText + "</button></div></div>"), s = '<div class="dropdown bootstrap-select' + e + t + '"><button type="button" class="' + this.options.styleBase + ' dropdown-toggle" ' + ("static" === this.options.display ? 'data-display="static"' : "") + 'data-toggle="dropdown"' + i + ' role="button"><div class="filter-option"><div class="filter-option-inner"><div class="filter-option-inner-inner"></div></div> </div>' + ("4" === M.major ? "" : '<span class="bs-caret">' + this.options.template.caret + "</span>") + '</button><div class="' + j.MENU + " " + ("4" === M.major ? "" : j.SHOW) + '" role="combobox">' + n + o + l + '<div class="inner ' + j.SHOW + '" role="listbox" aria-expanded="false" tabindex="-1"><ul class="' + j.MENU + " inner " + ("4" === M.major ? j.SHOW : "") + '"></ul></div>' + r + "</div></div>", z(s)
            }, setPositionData: function () {
                this.selectpicker.view.canHighlight = [];
                for (var e = 0; e < this.selectpicker.current.data.length; e++) {
                    var t = this.selectpicker.current.data[e], i = !0;
                    "divider" === t.type ? (i = !1, t.height = this.sizeInfo.dividerHeight) : "optgroup-label" === t.type ? (i = !1, t.height = this.sizeInfo.dropdownHeaderHeight) : t.height = this.sizeInfo.liHeight, t.disabled && (i = !1), this.selectpicker.view.canHighlight.push(i), t.position = (0 === e ? 0 : this.selectpicker.current.data[e - 1].position) + t.height
                }
            }, isVirtual: function () {
                return !1 !== this.options.virtualScroll && this.selectpicker.main.elements.length >= this.options.virtualScroll || !0 === this.options.virtualScroll
            }, createView: function (T, e) {
                e = e || 0;
                var A = this;
                this.selectpicker.current = T ? this.selectpicker.search : this.selectpicker.main;
                var N, D, H = [];

                function i(e, t) {
                    var i, s, n, o, l, r, a, c, d, h, p = A.selectpicker.current.elements.length, u = [], f = !0,
                        m = A.isVirtual();
                    A.selectpicker.view.scrollTop = e, !0 === m && A.sizeInfo.hasScrollBar && A.$menu[0].offsetWidth > A.sizeInfo.totalMenuWidth && (A.sizeInfo.menuWidth = A.$menu[0].offsetWidth, A.sizeInfo.totalMenuWidth = A.sizeInfo.menuWidth + A.sizeInfo.scrollBarWidth, A.$menu.css("min-width", A.sizeInfo.menuWidth)), i = Math.ceil(A.sizeInfo.menuInnerHeight / A.sizeInfo.liHeight * 1.5), s = Math.round(p / i) || 1;
                    for (var v = 0; v < s; v++) {
                        var g = (v + 1) * i;
                        if (v === s - 1 && (g = p), u[v] = [v * i + (v ? 1 : 0), g], !p) break;
                        void 0 === l && e <= A.selectpicker.current.data[g - 1].position - A.sizeInfo.menuInnerHeight && (l = v)
                    }
                    if (void 0 === l && (l = 0), r = [A.selectpicker.view.position0, A.selectpicker.view.position1], n = Math.max(0, l - 1), o = Math.min(s - 1, l + 1), A.selectpicker.view.position0 = !1 === m ? 0 : Math.max(0, u[n][0]) || 0, A.selectpicker.view.position1 = !1 === m ? p : Math.min(p, u[o][1]) || 0, a = r[0] !== A.selectpicker.view.position0 || r[1] !== A.selectpicker.view.position1, void 0 !== A.activeIndex && (D = A.selectpicker.main.elements[A.prevActiveIndex], H = A.selectpicker.main.elements[A.activeIndex], N = A.selectpicker.main.elements[A.selectedIndex], t && (A.activeIndex !== A.selectedIndex && H && H.length && (H.classList.remove("active"), H.firstChild && H.firstChild.classList.remove("active")), A.activeIndex = void 0), A.activeIndex && A.activeIndex !== A.selectedIndex && N && N.length && (N.classList.remove("active"), N.firstChild && N.firstChild.classList.remove("active"))), void 0 !== A.prevActiveIndex && A.prevActiveIndex !== A.activeIndex && A.prevActiveIndex !== A.selectedIndex && D && D.length && (D.classList.remove("active"), D.firstChild && D.firstChild.classList.remove("active")), (t || a) && (c = A.selectpicker.view.visibleElements ? A.selectpicker.view.visibleElements.slice() : [], A.selectpicker.view.visibleElements = !1 === m ? A.selectpicker.current.elements : A.selectpicker.current.elements.slice(A.selectpicker.view.position0, A.selectpicker.view.position1), A.setOptionStatus(), (T || !1 === m && t) && (d = c, h = A.selectpicker.view.visibleElements, f = !(d.length === h.length && d.every(function (e, t) {
                        return e === h[t]
                    }))), (t || !0 === m) && f)) {
                        var b, w, x = A.$menuInner[0], I = document.createDocumentFragment(),
                            k = x.firstChild.cloneNode(!1), $ = A.selectpicker.view.visibleElements, y = [];
                        x.replaceChild(k, x.firstChild);
                        v = 0;
                        for (var S = $.length; v < S; v++) {
                            var E, C, O = $[v];
                            A.options.sanitize && (E = O.lastChild) && (C = A.selectpicker.current.data[v + A.selectpicker.view.position0]) && C.content && !C.sanitized && (y.push(E), C.sanitized = !0), I.appendChild(O)
                        }
                        A.options.sanitize && y.length && B(y, A.options.whiteList, A.options.sanitizeFn), !0 === m && (b = 0 === A.selectpicker.view.position0 ? 0 : A.selectpicker.current.data[A.selectpicker.view.position0 - 1].position, w = A.selectpicker.view.position1 > p - 1 ? 0 : A.selectpicker.current.data[p - 1].position - A.selectpicker.current.data[A.selectpicker.view.position1 - 1].position, x.firstChild.style.marginTop = b + "px", x.firstChild.style.marginBottom = w + "px"), x.firstChild.appendChild(I)
                    }
                    if (A.prevActiveIndex = A.activeIndex, A.options.liveSearch) {
                        if (T && t) {
                            var z, L = 0;
                            A.selectpicker.view.canHighlight[L] || (L = 1 + A.selectpicker.view.canHighlight.slice(1).indexOf(!0)), z = A.selectpicker.view.visibleElements[L], A.selectpicker.view.currentActive && (A.selectpicker.view.currentActive.classList.remove("active"), A.selectpicker.view.currentActive.firstChild && A.selectpicker.view.currentActive.firstChild.classList.remove("active")), z && (z.classList.add("active"), z.firstChild && z.firstChild.classList.add("active")), A.activeIndex = (A.selectpicker.current.data[L] || {}).index
                        }
                    } else A.$menuInner.trigger("focus")
                }

                this.setPositionData(), i(e, !0), this.$menuInner.off("scroll.createView").on("scroll.createView", function (e, t) {
                    A.noScroll || i(this.scrollTop, t), A.noScroll = !1
                }), z(window).off("resize" + U + "." + this.selectId + ".createView").on("resize" + U + "." + this.selectId + ".createView", function () {
                    A.$newElement.hasClass(j.SHOW) && i(A.$menuInner[0].scrollTop)
                })
            }, setPlaceholder: function () {
                var e = !1;
                if (this.options.title && !this.multiple) {
                    this.selectpicker.view.titleOption || (this.selectpicker.view.titleOption = document.createElement("option")), e = !0;
                    var t = this.$element[0], i = !1, s = !this.selectpicker.view.titleOption.parentNode;
                    if (s) this.selectpicker.view.titleOption.className = "bs-title-option", this.selectpicker.view.titleOption.value = "", i = void 0 === z(t.options[t.selectedIndex]).attr("selected") && void 0 === this.$element.data("selected");
                    (s || 0 !== this.selectpicker.view.titleOption.index) && t.insertBefore(this.selectpicker.view.titleOption, t.firstChild), i && (t.selectedIndex = 0)
                }
                return e
            }, createLi: function () {
                var a = this, f = this.options.iconBase, m = ':not([hidden]):not([data-hidden="true"])', v = [], g = [],
                    c = 0, b = 0, e = this.setPlaceholder() ? 1 : 0;
                this.options.hideDisabled && (m += ":not(:disabled)"), !a.options.showTick && !a.multiple || F.checkMark.parentNode || (F.checkMark.className = f + " " + a.options.tickIcon + " check-mark", F.a.appendChild(F.checkMark));
                var t = this.$element[0].querySelectorAll("select > *" + m);

                function w(e) {
                    var t = g[g.length - 1];
                    t && "divider" === t.type && (t.optID || e.optID) || ((e = e || {}).type = "divider", v.push(G(!1, j.DIVIDER, e.optID ? e.optID + "div" : void 0)), g.push(e))
                }

                function x(e, t) {
                    if ((t = t || {}).divider = "true" === e.getAttribute("data-divider"), t.divider) w({optID: t.optID}); else {
                        var i = g.length, s = e.style.cssText, n = s ? O(s) : "",
                            o = (e.className || "") + (t.optgroupClass || "");
                        t.optID && (o = "opt " + o), t.text = e.textContent, t.content = e.getAttribute("data-content"), t.tokens = e.getAttribute("data-tokens"), t.subtext = e.getAttribute("data-subtext"), t.icon = e.getAttribute("data-icon"), t.iconBase = f;
                        var l = Y(t);
                        v.push(G(K(l, o, n), "", t.optID)), e.liIndex = i, t.display = t.content || t.text, t.type = "option", t.index = i, t.option = e, t.disabled = t.disabled || e.disabled, g.push(t);
                        var r = 0;
                        t.display && (r += t.display.length), t.subtext && (r += t.subtext.length), t.icon && (r += 1), c < r && (c = r, a.selectpicker.view.widestOption = v[v.length - 1])
                    }
                }

                function i(e, t) {
                    var i = t[e], s = t[e - 1], n = t[e + 1], o = i.querySelectorAll("option" + m);
                    if (o.length) {
                        var l, r, a = {
                            label: O(i.label),
                            subtext: i.getAttribute("data-subtext"),
                            icon: i.getAttribute("data-icon"),
                            iconBase: f
                        }, c = " " + (i.className || "");
                        b++, s && w({optID: b});
                        var d = Z(a);
                        v.push(G(d, "dropdown-header" + c, b)), g.push({
                            display: a.label,
                            subtext: a.subtext,
                            type: "optgroup-label",
                            optID: b
                        });
                        for (var h = 0, p = o.length; h < p; h++) {
                            var u = o[h];
                            0 === h && (r = (l = g.length - 1) + p), x(u, {
                                headerIndex: l,
                                lastIndex: r,
                                optID: b,
                                optgroupClass: c,
                                disabled: i.disabled
                            })
                        }
                        n && w({optID: b})
                    }
                }

                for (var s = t.length; e < s; e++) {
                    var n = t[e];
                    "OPTGROUP" !== n.tagName ? x(n, {}) : i(e, t)
                }
                this.selectpicker.main.elements = v, this.selectpicker.main.data = g, this.selectpicker.current = this.selectpicker.main
            }, findLis: function () {
                return this.$menuInner.find(".inner > li")
            }, render: function () {
                this.setPlaceholder();
                var e, t, i = this, s = this.$element[0].selectedOptions, n = s.length, o = this.$button[0],
                    l = o.querySelector(".filter-option-inner-inner"),
                    r = document.createTextNode(this.options.multipleSeparator), a = F.fragment.cloneNode(!1), c = !1;
                if (this.togglePlaceholder(), this.tabIndex(), "static" === this.options.selectedTextFormat) a = Y({text: this.options.title}, !0); else if ((e = this.multiple && -1 !== this.options.selectedTextFormat.indexOf("count") && 1 < n) && (e = 1 < (t = this.options.selectedTextFormat.split(">")).length && n > t[1] || 1 === t.length && 2 <= n), !1 === e) {
                    for (var d = 0; d < n && d < 50; d++) {
                        var h = s[d], p = {}, u = {
                            content: h.getAttribute("data-content"),
                            subtext: h.getAttribute("data-subtext"),
                            icon: h.getAttribute("data-icon")
                        };
                        this.multiple && 0 < d && a.appendChild(r.cloneNode(!1)), h.title ? p.text = h.title : u.content && i.options.showContent ? (p.content = u.content.toString(), c = !0) : (i.options.showIcon && (p.icon = u.icon, p.iconBase = this.options.iconBase), i.options.showSubtext && !i.multiple && u.subtext && (p.subtext = " " + u.subtext), p.text = h.textContent.trim()), a.appendChild(Y(p, !0))
                    }
                    49 < n && a.appendChild(document.createTextNode("..."))
                } else {
                    var f = ':not([hidden]):not([data-hidden="true"]):not([data-divider="true"])';
                    this.options.hideDisabled && (f += ":not(:disabled)");
                    var m = this.$element[0].querySelectorAll("select > option" + f + ", optgroup" + f + " option" + f).length,
                        v = "function" == typeof this.options.countSelectedText ? this.options.countSelectedText(n, m) : this.options.countSelectedText;
                    a = Y({text: v.replace("{0}", n.toString()).replace("{1}", m.toString())}, !0)
                }
                if (null == this.options.title && (this.options.title = this.$element.attr("title")), a.childNodes.length || (a = Y({text: void 0 !== this.options.title ? this.options.title : this.options.noneSelectedText}, !0)), o.title = a.textContent.replace(/<[^>]*>?/g, "").trim(), this.options.sanitize && c && B([a], i.options.whiteList, i.options.sanitizeFn), l.innerHTML = "", l.appendChild(a), M.major < 4 && this.$newElement[0].classList.contains("bs3-has-addon")) {
                    var g = o.querySelector(".filter-expand"), b = l.cloneNode(!0);
                    b.className = "filter-expand", g ? o.replaceChild(b, g) : o.appendChild(b)
                }
                this.$element.trigger("rendered" + U)
            }, setStyle: function (e, t) {
                var i, s = this.$button[0], n = this.$newElement[0], o = this.options.style.trim();
                this.$element.attr("class") && this.$newElement.addClass(this.$element.attr("class").replace(/selectpicker|mobile-device|bs-select-hidden|validate\[.*\]/gi, "")), M.major < 4 && (n.classList.add("bs3"), n.parentNode.classList.contains("input-group") && (n.previousElementSibling || n.nextElementSibling) && (n.previousElementSibling || n.nextElementSibling).classList.contains("input-group-addon") && n.classList.add("bs3-has-addon")), i = e ? e.trim() : o, "add" == t ? i && s.classList.add.apply(s.classList, i.split(" ")) : "remove" == t ? i && s.classList.remove.apply(s.classList, i.split(" ")) : (o && s.classList.remove.apply(s.classList, o.split(" ")), i && s.classList.add.apply(s.classList, i.split(" ")))
            }, liHeight: function (e) {
                if (e || !1 !== this.options.size && !this.sizeInfo) {
                    this.sizeInfo || (this.sizeInfo = {});
                    var t = document.createElement("div"), i = document.createElement("div"),
                        s = document.createElement("div"), n = document.createElement("ul"),
                        o = document.createElement("li"), l = document.createElement("li"),
                        r = document.createElement("li"), a = document.createElement("a"),
                        c = document.createElement("span"),
                        d = this.options.header && 0 < this.$menu.find("." + j.POPOVERHEADER).length ? this.$menu.find("." + j.POPOVERHEADER)[0].cloneNode(!0) : null,
                        h = this.options.liveSearch ? document.createElement("div") : null,
                        p = this.options.actionsBox && this.multiple && 0 < this.$menu.find(".bs-actionsbox").length ? this.$menu.find(".bs-actionsbox")[0].cloneNode(!0) : null,
                        u = this.options.doneButton && this.multiple && 0 < this.$menu.find(".bs-donebutton").length ? this.$menu.find(".bs-donebutton")[0].cloneNode(!0) : null,
                        f = this.$element.find("option")[0];
                    if (this.sizeInfo.selectWidth = this.$newElement[0].offsetWidth, c.className = "text", a.className = "dropdown-item " + (f ? f.className : ""), t.className = this.$menu[0].parentNode.className + " " + j.SHOW, t.style.width = this.sizeInfo.selectWidth + "px", "auto" === this.options.width && (i.style.minWidth = 0), i.className = j.MENU + " " + j.SHOW, s.className = "inner " + j.SHOW, n.className = j.MENU + " inner " + ("4" === M.major ? j.SHOW : ""), o.className = j.DIVIDER, l.className = "dropdown-header", c.appendChild(document.createTextNode("\u200b")), a.appendChild(c), r.appendChild(a), l.appendChild(c.cloneNode(!0)), this.selectpicker.view.widestOption && n.appendChild(this.selectpicker.view.widestOption.cloneNode(!0)), n.appendChild(r), n.appendChild(o), n.appendChild(l), d && i.appendChild(d), h) {
                        var m = document.createElement("input");
                        h.className = "bs-searchbox", m.className = "form-control", h.appendChild(m), i.appendChild(h)
                    }
                    p && i.appendChild(p), s.appendChild(n), i.appendChild(s), u && i.appendChild(u), t.appendChild(i), document.body.appendChild(t);
                    var v, g = r.offsetHeight, b = l ? l.offsetHeight : 0, w = d ? d.offsetHeight : 0,
                        x = h ? h.offsetHeight : 0, I = p ? p.offsetHeight : 0, k = u ? u.offsetHeight : 0,
                        $ = z(o).outerHeight(!0), y = !!window.getComputedStyle && window.getComputedStyle(i),
                        S = i.offsetWidth, E = y ? null : z(i), C = {
                            vert: L(y ? y.paddingTop : E.css("paddingTop")) + L(y ? y.paddingBottom : E.css("paddingBottom")) + L(y ? y.borderTopWidth : E.css("borderTopWidth")) + L(y ? y.borderBottomWidth : E.css("borderBottomWidth")),
                            horiz: L(y ? y.paddingLeft : E.css("paddingLeft")) + L(y ? y.paddingRight : E.css("paddingRight")) + L(y ? y.borderLeftWidth : E.css("borderLeftWidth")) + L(y ? y.borderRightWidth : E.css("borderRightWidth"))
                        }, O = {
                            vert: C.vert + L(y ? y.marginTop : E.css("marginTop")) + L(y ? y.marginBottom : E.css("marginBottom")) + 2,
                            horiz: C.horiz + L(y ? y.marginLeft : E.css("marginLeft")) + L(y ? y.marginRight : E.css("marginRight")) + 2
                        };
                    s.style.overflowY = "scroll", v = i.offsetWidth - S, document.body.removeChild(t), this.sizeInfo.liHeight = g, this.sizeInfo.dropdownHeaderHeight = b, this.sizeInfo.headerHeight = w, this.sizeInfo.searchHeight = x, this.sizeInfo.actionsHeight = I, this.sizeInfo.doneButtonHeight = k, this.sizeInfo.dividerHeight = $, this.sizeInfo.menuPadding = C, this.sizeInfo.menuExtras = O, this.sizeInfo.menuWidth = S, this.sizeInfo.totalMenuWidth = this.sizeInfo.menuWidth, this.sizeInfo.scrollBarWidth = v, this.sizeInfo.selectHeight = this.$newElement[0].offsetHeight, this.setPositionData()
                }
            }, getSelectPosition: function () {
                var e, t = z(window), i = this.$newElement.offset(), s = z(this.options.container);
                this.options.container && s.length && !s.is("body") ? ((e = s.offset()).top += parseInt(s.css("borderTopWidth")), e.left += parseInt(s.css("borderLeftWidth"))) : e = {
                    top: 0,
                    left: 0
                };
                var n = this.options.windowPadding;
                this.sizeInfo.selectOffsetTop = i.top - e.top - t.scrollTop(), this.sizeInfo.selectOffsetBot = t.height() - this.sizeInfo.selectOffsetTop - this.sizeInfo.selectHeight - e.top - n[2], this.sizeInfo.selectOffsetLeft = i.left - e.left - t.scrollLeft(), this.sizeInfo.selectOffsetRight = t.width() - this.sizeInfo.selectOffsetLeft - this.sizeInfo.selectWidth - e.left - n[1], this.sizeInfo.selectOffsetTop -= n[0], this.sizeInfo.selectOffsetLeft -= n[3]
            }, setMenuSize: function (e) {
                this.getSelectPosition();
                var t, i, s, n, o, l, r, a = this.sizeInfo.selectWidth, c = this.sizeInfo.liHeight,
                    d = this.sizeInfo.headerHeight, h = this.sizeInfo.searchHeight, p = this.sizeInfo.actionsHeight,
                    u = this.sizeInfo.doneButtonHeight, f = this.sizeInfo.dividerHeight, m = this.sizeInfo.menuPadding,
                    v = 0;
                if (this.options.dropupAuto && (r = c * this.selectpicker.current.elements.length + m.vert, this.$newElement.toggleClass(j.DROPUP, this.sizeInfo.selectOffsetTop - this.sizeInfo.selectOffsetBot > this.sizeInfo.menuExtras.vert && r + this.sizeInfo.menuExtras.vert + 50 > this.sizeInfo.selectOffsetBot)), "auto" === this.options.size) n = 3 < this.selectpicker.current.elements.length ? 3 * this.sizeInfo.liHeight + this.sizeInfo.menuExtras.vert - 2 : 0, i = this.sizeInfo.selectOffsetBot - this.sizeInfo.menuExtras.vert, s = n + d + h + p + u, l = Math.max(n - m.vert, 0), this.$newElement.hasClass(j.DROPUP) && (i = this.sizeInfo.selectOffsetTop - this.sizeInfo.menuExtras.vert), t = (o = i) - d - h - p - u - m.vert; else if (this.options.size && "auto" != this.options.size && this.selectpicker.current.elements.length > this.options.size) {
                    for (var g = 0; g < this.options.size; g++) "divider" === this.selectpicker.current.data[g].type && v++;
                    t = (i = c * this.options.size + v * f + m.vert) - m.vert, o = i + d + h + p + u, s = l = ""
                }
                "auto" === this.options.dropdownAlignRight && this.$menu.toggleClass(j.MENURIGHT, this.sizeInfo.selectOffsetLeft > this.sizeInfo.selectOffsetRight && this.sizeInfo.selectOffsetRight < this.sizeInfo.totalMenuWidth - a), this.$menu.css({
                    "max-height": o + "px",
                    overflow: "hidden",
                    "min-height": s + "px"
                }), this.$menuInner.css({
                    "max-height": t + "px",
                    "overflow-y": "auto",
                    "min-height": l + "px"
                }), this.sizeInfo.menuInnerHeight = Math.max(t, 1), this.selectpicker.current.data.length && this.selectpicker.current.data[this.selectpicker.current.data.length - 1].position > this.sizeInfo.menuInnerHeight && (this.sizeInfo.hasScrollBar = !0, this.sizeInfo.totalMenuWidth = this.sizeInfo.menuWidth + this.sizeInfo.scrollBarWidth, this.$menu.css("min-width", this.sizeInfo.totalMenuWidth)), this.dropdown && this.dropdown._popper && this.dropdown._popper.update()
            }, setSize: function (e) {
                if (this.liHeight(e), this.options.header && this.$menu.css("padding-top", 0), !1 !== this.options.size) {
                    var t, i = this, s = z(window), n = 0;
                    if (this.setMenuSize(), this.options.liveSearch && this.$searchbox.off("input.setMenuSize propertychange.setMenuSize").on("input.setMenuSize propertychange.setMenuSize", function () {
                        return i.setMenuSize()
                    }), "auto" === this.options.size ? s.off("resize" + U + "." + this.selectId + ".setMenuSize scroll" + U + "." + this.selectId + ".setMenuSize").on("resize" + U + "." + this.selectId + ".setMenuSize scroll" + U + "." + this.selectId + ".setMenuSize", function () {
                        return i.setMenuSize()
                    }) : this.options.size && "auto" != this.options.size && this.selectpicker.current.elements.length > this.options.size && s.off("resize" + U + "." + this.selectId + ".setMenuSize scroll" + U + "." + this.selectId + ".setMenuSize"), e) n = this.$menuInner[0].scrollTop; else if (!i.multiple) {
                        var o = i.$element[0];
                        "number" == typeof (t = (o.options[o.selectedIndex] || {}).liIndex) && !1 !== i.options.size && (n = (n = i.sizeInfo.liHeight * t) - i.sizeInfo.menuInnerHeight / 2 + i.sizeInfo.liHeight / 2)
                    }
                    i.createView(!1, n)
                }
            }, setWidth: function () {
                var i = this;
                "auto" === this.options.width ? requestAnimationFrame(function () {
                    i.$menu.css("min-width", "0"), i.$element.on("loaded" + U, function () {
                        i.liHeight(), i.setMenuSize();
                        var e = i.$newElement.clone().appendTo("body"),
                            t = e.css("width", "auto").children("button").outerWidth();
                        e.remove(), i.sizeInfo.selectWidth = Math.max(i.sizeInfo.totalMenuWidth, t), i.$newElement.css("width", i.sizeInfo.selectWidth + "px")
                    })
                }) : "fit" === this.options.width ? (this.$menu.css("min-width", ""), this.$newElement.css("width", "").addClass("fit-width")) : this.options.width ? (this.$menu.css("min-width", ""), this.$newElement.css("width", this.options.width)) : (this.$menu.css("min-width", ""), this.$newElement.css("width", "")), this.$newElement.hasClass("fit-width") && "fit" !== this.options.width && this.$newElement[0].classList.remove("fit-width")
            }, selectPosition: function () {
                this.$bsContainer = z('<div class="bs-container" />');
                var s, n, o, l = this, r = z(this.options.container), e = function (e) {
                    var t = {},
                        i = l.options.display || !!z.fn.dropdown.Constructor.Default && z.fn.dropdown.Constructor.Default.display;
                    l.$bsContainer.addClass(e.attr("class").replace(/form-control|fit-width/gi, "")).toggleClass(j.DROPUP, e.hasClass(j.DROPUP)), s = e.offset(), r.is("body") ? n = {
                        top: 0,
                        left: 0
                    } : ((n = r.offset()).top += parseInt(r.css("borderTopWidth")) - r.scrollTop(), n.left += parseInt(r.css("borderLeftWidth")) - r.scrollLeft()), o = e.hasClass(j.DROPUP) ? 0 : e[0].offsetHeight, (M.major < 4 || "static" === i) && (t.top = s.top - n.top + o, t.left = s.left - n.left), t.width = e[0].offsetWidth, l.$bsContainer.css(t)
                };
                this.$button.on("click.bs.dropdown.data-api", function () {
                    l.isDisabled() || (e(l.$newElement), l.$bsContainer.appendTo(l.options.container).toggleClass(j.SHOW, !l.$button.hasClass(j.SHOW)).append(l.$menu))
                }), z(window).off("resize" + U + "." + this.selectId + " scroll" + U + "." + this.selectId).on("resize" + U + "." + this.selectId + " scroll" + U + "." + this.selectId, function () {
                    l.$newElement.hasClass(j.SHOW) && e(l.$newElement)
                }), this.$element.on("hide" + U, function () {
                    l.$menu.data("height", l.$menu.height()), l.$bsContainer.detach()
                })
            }, setOptionStatus: function () {
                var e = this;
                if (e.noScroll = !1, e.selectpicker.view.visibleElements && e.selectpicker.view.visibleElements.length) for (var t = 0; t < e.selectpicker.view.visibleElements.length; t++) {
                    var i = e.selectpicker.current.data[t + e.selectpicker.view.position0], s = i.option;
                    s && (e.setDisabled(i.index, i.disabled), e.setSelected(i.index, s.selected))
                }
            }, setSelected: function (e, t) {
                var i, s, n = this.selectpicker.main.elements[e], o = this.selectpicker.main.data[e],
                    l = void 0 !== this.activeIndex, r = this.activeIndex === e || t && !this.multiple && !l;
                o.selected = t, s = n.firstChild, t && (this.selectedIndex = e), n.classList.toggle("selected", t), n.classList.toggle("active", r), r && (this.selectpicker.view.currentActive = n, this.activeIndex = e), s && (s.classList.toggle("selected", t), s.classList.toggle("active", r), s.setAttribute("aria-selected", t)), r || !l && t && void 0 !== this.prevActiveIndex && ((i = this.selectpicker.main.elements[this.prevActiveIndex]).classList.remove("active"), i.firstChild && i.firstChild.classList.remove("active"))
            }, setDisabled: function (e, t) {
                var i, s = this.selectpicker.main.elements[e];
                this.selectpicker.main.data[e].disabled = t, i = s.firstChild, s.classList.toggle(j.DISABLED, t), i && ("4" === M.major && i.classList.toggle(j.DISABLED, t), i.setAttribute("aria-disabled", t), t ? i.setAttribute("tabindex", -1) : i.setAttribute("tabindex", 0))
            }, isDisabled: function () {
                return this.$element[0].disabled
            }, checkDisabled: function () {
                var e = this;
                this.isDisabled() ? (this.$newElement[0].classList.add(j.DISABLED), this.$button.addClass(j.DISABLED).attr("tabindex", -1).attr("aria-disabled", !0)) : (this.$button[0].classList.contains(j.DISABLED) && (this.$newElement[0].classList.remove(j.DISABLED), this.$button.removeClass(j.DISABLED).attr("aria-disabled", !1)), -1 != this.$button.attr("tabindex") || this.$element.data("tabindex") || this.$button.removeAttr("tabindex")), this.$button.on("click", function () {
                    return !e.isDisabled()
                })
            }, togglePlaceholder: function () {
                var e = this.$element[0], t = e.selectedIndex, i = -1 === t;
                i || e.options[t].value || (i = !0), this.$button.toggleClass("bs-placeholder", i)
            }, tabIndex: function () {
                this.$element.data("tabindex") !== this.$element.attr("tabindex") && -98 !== this.$element.attr("tabindex") && "-98" !== this.$element.attr("tabindex") && (this.$element.data("tabindex", this.$element.attr("tabindex")), this.$button.attr("tabindex", this.$element.data("tabindex"))), this.$element.attr("tabindex", -98)
            }, clickListener: function () {
                var S = this, t = z(document);

                function e() {
                    S.options.liveSearch ? S.$searchbox.trigger("focus") : S.$menuInner.trigger("focus")
                }

                function i() {
                    S.dropdown && S.dropdown._popper && S.dropdown._popper.state.isCreated ? e() : requestAnimationFrame(i)
                }

                t.data("spaceSelect", !1), this.$button.on("keyup", function (e) {
                    /(32)/.test(e.keyCode.toString(10)) && t.data("spaceSelect") && (e.preventDefault(), t.data("spaceSelect", !1))
                }), this.$newElement.on("show.bs.dropdown", function () {
                    3 < M.major && !S.dropdown && (S.dropdown = S.$button.data("bs.dropdown"), S.dropdown._menu = S.$menu[0])
                }), this.$button.on("click.bs.dropdown.data-api", function () {
                    S.$newElement.hasClass(j.SHOW) || S.setSize()
                }), this.$element.on("shown" + U, function () {
                    S.$menuInner[0].scrollTop !== S.selectpicker.view.scrollTop && (S.$menuInner[0].scrollTop = S.selectpicker.view.scrollTop), 3 < M.major ? requestAnimationFrame(i) : e()
                }), this.$menuInner.on("click", "li a", function (e, t) {
                    var i = z(this), s = S.isVirtual() ? S.selectpicker.view.position0 : 0,
                        n = S.selectpicker.current.data[i.parent().index() + s], o = n.index, l = E(S.$element[0]),
                        r = S.$element.prop("selectedIndex"), a = !0;
                    if (S.multiple && 1 !== S.options.maxOptions && e.stopPropagation(), e.preventDefault(), !S.isDisabled() && !i.parent().hasClass(j.DISABLED)) {
                        var c = S.$element.find("option"), d = n.option, h = z(d), p = d.selected,
                            u = h.parent("optgroup"), f = u.find("option"), m = S.options.maxOptions,
                            v = u.data("maxOptions") || !1;
                        if (o === S.activeIndex && (t = !0), t || (S.prevActiveIndex = S.activeIndex, S.activeIndex = void 0), S.multiple) {
                            if (d.selected = !p, S.setSelected(o, !p), i.trigger("blur"), !1 !== m || !1 !== v) {
                                var g = m < c.filter(":selected").length, b = v < u.find("option:selected").length;
                                if (m && g || v && b) if (m && 1 == m) {
                                    c.prop("selected", !1), h.prop("selected", !0);
                                    for (var w = 0; w < c.length; w++) S.setSelected(w, !1);
                                    S.setSelected(o, !0)
                                } else if (v && 1 == v) {
                                    u.find("option:selected").prop("selected", !1), h.prop("selected", !0);
                                    for (w = 0; w < f.length; w++) {
                                        d = f[w];
                                        S.setSelected(c.index(d), !1)
                                    }
                                    S.setSelected(o, !0)
                                } else {
                                    var x = "string" == typeof S.options.maxOptionsText ? [S.options.maxOptionsText, S.options.maxOptionsText] : S.options.maxOptionsText,
                                        I = "function" == typeof x ? x(m, v) : x, k = I[0].replace("{n}", m),
                                        $ = I[1].replace("{n}", v), y = z('<div class="notify"></div>');
                                    I[2] && (k = k.replace("{var}", I[2][1 < m ? 0 : 1]), $ = $.replace("{var}", I[2][1 < v ? 0 : 1])), h.prop("selected", !1), S.$menu.append(y), m && g && (y.append(z("<div>" + k + "</div>")), a = !1, S.$element.trigger("maxReached" + U)), v && b && (y.append(z("<div>" + $ + "</div>")), a = !1, S.$element.trigger("maxReachedGrp" + U)), setTimeout(function () {
                                        S.setSelected(o, !1)
                                    }, 10), y.delay(750).fadeOut(300, function () {
                                        z(this).remove()
                                    })
                                }
                            }
                        } else c.prop("selected", !1), d.selected = !0, S.setSelected(o, !0);
                        !S.multiple || S.multiple && 1 === S.options.maxOptions ? S.$button.trigger("focus") : S.options.liveSearch && S.$searchbox.trigger("focus"), a && (l != E(S.$element[0]) && S.multiple || r != S.$element.prop("selectedIndex") && !S.multiple) && (C = [d.index, h.prop("selected"), l], S.$element.triggerNative("change"))
                    }
                }), this.$menu.on("click", "li." + j.DISABLED + " a, ." + j.POPOVERHEADER + ", ." + j.POPOVERHEADER + " :not(.close)", function (e) {
                    e.currentTarget == this && (e.preventDefault(), e.stopPropagation(), S.options.liveSearch && !z(e.target).hasClass("close") ? S.$searchbox.trigger("focus") : S.$button.trigger("focus"))
                }), this.$menuInner.on("click", ".divider, .dropdown-header", function (e) {
                    e.preventDefault(), e.stopPropagation(), S.options.liveSearch ? S.$searchbox.trigger("focus") : S.$button.trigger("focus")
                }), this.$menu.on("click", "." + j.POPOVERHEADER + " .close", function () {
                    S.$button.trigger("click")
                }), this.$searchbox.on("click", function (e) {
                    e.stopPropagation()
                }), this.$menu.on("click", ".actions-btn", function (e) {
                    S.options.liveSearch ? S.$searchbox.trigger("focus") : S.$button.trigger("focus"), e.preventDefault(), e.stopPropagation(), z(this).hasClass("bs-select-all") ? S.selectAll() : S.deselectAll()
                }), this.$element.on("change" + U, function () {
                    S.render(), S.$element.trigger("changed" + U, C), C = null
                }).on("focus" + U, function () {
                    S.options.mobile || S.$button.trigger("focus")
                })
            }, liveSearchListener: function () {
                var u = this, f = document.createElement("li");
                this.$button.on("click.bs.dropdown.data-api", function () {
                    u.$searchbox.val() && u.$searchbox.val("")
                }), this.$searchbox.on("click.bs.dropdown.data-api focus.bs.dropdown.data-api touchend.bs.dropdown.data-api", function (e) {
                    e.stopPropagation()
                }), this.$searchbox.on("input propertychange", function () {
                    var e = u.$searchbox.val();
                    if (u.selectpicker.search.elements = [], u.selectpicker.search.data = [], e) {
                        var t = [], i = e.toUpperCase(), s = {}, n = [], o = u._searchStyle(),
                            l = u.options.liveSearchNormalize;
                        l && (i = w(i)), u._$lisSelected = u.$menuInner.find(".selected");
                        for (var r = 0; r < u.selectpicker.main.data.length; r++) {
                            var a = u.selectpicker.main.data[r];
                            s[r] || (s[r] = $(a, i, o, l)), s[r] && void 0 !== a.headerIndex && -1 === n.indexOf(a.headerIndex) && (0 < a.headerIndex && (s[a.headerIndex - 1] = !0, n.push(a.headerIndex - 1)), s[a.headerIndex] = !0, n.push(a.headerIndex), s[a.lastIndex + 1] = !0), s[r] && "optgroup-label" !== a.type && n.push(r)
                        }
                        r = 0;
                        for (var c = n.length; r < c; r++) {
                            var d = n[r], h = n[r - 1],
                                p = (a = u.selectpicker.main.data[d], u.selectpicker.main.data[h]);
                            ("divider" !== a.type || "divider" === a.type && p && "divider" !== p.type && c - 1 !== r) && (u.selectpicker.search.data.push(a), t.push(u.selectpicker.main.elements[d]))
                        }
                        u.activeIndex = void 0, u.noScroll = !0, u.$menuInner.scrollTop(0), u.selectpicker.search.elements = t, u.createView(!0), t.length || (f.className = "no-results", f.innerHTML = u.options.noneResultsText.replace("{0}", '"' + O(e) + '"'), u.$menuInner[0].firstChild.appendChild(f))
                    } else u.$menuInner.scrollTop(0), u.createView(!1)
                })
            }, _searchStyle: function () {
                return this.options.liveSearchStyle || "contains"
            }, val: function (e) {
                if (void 0 === e) return this.$element.val();
                var t = E(this.$element[0]);
                return C = [null, null, t], this.$element.val(e).trigger("changed" + U, C), this.render(), C = null, this.$element
            }, changeAll: function (e) {
                if (this.multiple) {
                    void 0 === e && (e = !0);
                    var t = this.$element[0], i = 0, s = 0, n = E(t);
                    t.classList.add("bs-select-hidden");
                    for (var o = 0, l = this.selectpicker.current.elements.length; o < l; o++) {
                        var r = this.selectpicker.current.data[o], a = r.option;
                        a && !r.disabled && "divider" !== r.type && (r.selected && i++, (a.selected = e) && s++)
                    }
                    t.classList.remove("bs-select-hidden"), i !== s && (this.setOptionStatus(), this.togglePlaceholder(), C = [null, null, n], this.$element.triggerNative("change"))
                }
            }, selectAll: function () {
                return this.changeAll(!0)
            }, deselectAll: function () {
                return this.changeAll(!1)
            }, toggle: function (e) {
                (e = e || window.event) && e.stopPropagation(), this.$button.trigger("click.bs.dropdown.data-api")
            }, keydown: function (e) {
                var t, i, s, n, o, l = z(this), r = l.hasClass("dropdown-toggle"),
                    a = (r ? l.closest(".dropdown") : l.closest(V.MENU)).data("this"), c = a.findLis(), d = !1,
                    h = e.which === H && !r && !a.options.selectOnTab, p = _.test(e.which) || h,
                    u = a.$menuInner[0].scrollTop, f = a.isVirtual(), m = !0 === f ? a.selectpicker.view.position0 : 0;
                if (!(i = a.$newElement.hasClass(j.SHOW)) && (p || 48 <= e.which && e.which <= 57 || 96 <= e.which && e.which <= 105 || 65 <= e.which && e.which <= 90) && (a.$button.trigger("click.bs.dropdown.data-api"), a.options.liveSearch)) a.$searchbox.trigger("focus"); else {
                    if (e.which === A && i && (e.preventDefault(), a.$button.trigger("click.bs.dropdown.data-api").trigger("focus")), p) {
                        if (!c.length) return;
                        void 0 === (t = !0 === f ? c.index(c.filter(".active")) : a.activeIndex) && (t = -1), -1 !== t && ((s = a.selectpicker.current.elements[t + m]).classList.remove("active"), s.firstChild && s.firstChild.classList.remove("active")), e.which === P ? (-1 !== t && t--, t + m < 0 && (t += c.length), a.selectpicker.view.canHighlight[t + m] || -1 === (t = a.selectpicker.view.canHighlight.slice(0, t + m).lastIndexOf(!0) - m) && (t = c.length - 1)) : (e.which === W || h) && (++t + m >= a.selectpicker.view.canHighlight.length && (t = 0), a.selectpicker.view.canHighlight[t + m] || (t = t + 1 + a.selectpicker.view.canHighlight.slice(t + m + 1).indexOf(!0))), e.preventDefault();
                        var v = m + t;
                        e.which === P ? 0 === m && t === c.length - 1 ? (a.$menuInner[0].scrollTop = a.$menuInner[0].scrollHeight, v = a.selectpicker.current.elements.length - 1) : d = (o = (n = a.selectpicker.current.data[v]).position - n.height) < u : (e.which === W || h) && (0 === t ? v = a.$menuInner[0].scrollTop = 0 : d = u < (o = (n = a.selectpicker.current.data[v]).position - a.sizeInfo.menuInnerHeight)), (s = a.selectpicker.current.elements[v]) && (s.classList.add("active"), s.firstChild && s.firstChild.classList.add("active")), a.activeIndex = a.selectpicker.current.data[v].index, a.selectpicker.view.currentActive = s, d && (a.$menuInner[0].scrollTop = o), a.options.liveSearch ? a.$searchbox.trigger("focus") : l.trigger("focus")
                    } else if (!l.is("input") && !q.test(e.which) || e.which === D && a.selectpicker.keydown.keyHistory) {
                        var g, b, w = [];
                        e.preventDefault(), a.selectpicker.keydown.keyHistory += T[e.which], a.selectpicker.keydown.resetKeyHistory.cancel && clearTimeout(a.selectpicker.keydown.resetKeyHistory.cancel), a.selectpicker.keydown.resetKeyHistory.cancel = a.selectpicker.keydown.resetKeyHistory.start(), b = a.selectpicker.keydown.keyHistory, /^(.)\1+$/.test(b) && (b = b.charAt(0));
                        for (var x = 0; x < a.selectpicker.current.data.length; x++) {
                            var I = a.selectpicker.current.data[x];
                            $(I, b, "startsWith", !0) && a.selectpicker.view.canHighlight[x] && w.push(I.index)
                        }
                        if (w.length) {
                            var k = 0;
                            c.removeClass("active").find("a").removeClass("active"), 1 === b.length && (-1 === (k = w.indexOf(a.activeIndex)) || k === w.length - 1 ? k = 0 : k++), g = w[k], d = 0 < u - (n = a.selectpicker.main.data[g]).position ? (o = n.position - n.height, !0) : (o = n.position - a.sizeInfo.menuInnerHeight, n.position > u + a.sizeInfo.menuInnerHeight), (s = a.selectpicker.main.elements[g]).classList.add("active"), s.firstChild && s.firstChild.classList.add("active"), a.activeIndex = w[k], s.firstChild.focus(), d && (a.$menuInner[0].scrollTop = o), l.trigger("focus")
                        }
                    }
                    i && (e.which === D && !a.selectpicker.keydown.keyHistory || e.which === N || e.which === H && a.options.selectOnTab) && (e.which !== D && e.preventDefault(), a.options.liveSearch && e.which === D || (a.$menuInner.find(".active a").trigger("click", !0), l.trigger("focus"), a.options.liveSearch || (e.preventDefault(), z(document).data("spaceSelect", !0))))
                }
            }, mobile: function () {
                this.$element[0].classList.add("mobile-device")
            }, refresh: function () {
                var e = z.extend({}, this.options, this.$element.data());
                this.options = e, this.checkDisabled(), this.setStyle(), this.render(), this.createLi(), this.setWidth(), this.setSize(!0), this.$element.trigger("refreshed" + U)
            }, hide: function () {
                this.$newElement.hide()
            }, show: function () {
                this.$newElement.show()
            }, remove: function () {
                this.$newElement.remove(), this.$element.remove()
            }, destroy: function () {
                this.$newElement.before(this.$element).remove(), this.$bsContainer ? this.$bsContainer.remove() : this.$menu.remove(), this.$element.off(U).removeData("selectpicker").removeClass("bs-select-hidden selectpicker"), z(window).off(U + "." + this.selectId)
            }
        };
        var X = z.fn.selectpicker;
        z.fn.selectpicker = Q, z.fn.selectpicker.Constructor = J, z.fn.selectpicker.noConflict = function () {
            return z.fn.selectpicker = X, this
        }, z(document).off("keydown.bs.dropdown.data-api").on("keydown" + U, '.bootstrap-select [data-toggle="dropdown"], .bootstrap-select [role="listbox"], .bootstrap-select .bs-searchbox input', J.prototype.keydown).on("focusin.modal", '.bootstrap-select [data-toggle="dropdown"], .bootstrap-select [role="listbox"], .bootstrap-select .bs-searchbox input', function (e) {
            e.stopPropagation()
        }), z(window).on("load" + U + ".data-api", function () {
            z(".selectpicker").each(function () {
                var e = z(this);
                Q.call(e, e.data())
            })
        })
    }(e)
});
//# sourceMappingURL=bootstrap-select.min.js.map


/*! jQuery Validation Plugin - v1.12.0 - 4/1/2014
 * http://jqueryvalidation.org/
 * Copyright (c) 2014 Jörn Zaefferer; Licensed MIT */
!function (a) {
    a.extend(a.fn, {
        validate: function (b) {
            if (!this.length) return void (b && b.debug && window.console && console.warn("Nothing selected, can't validate, returning nothing."));
            var c = a.data(this[0], "validator");
            return c ? c : (this.attr("novalidate", "novalidate"), c = new a.validator(b, this[0]), a.data(this[0], "validator", c), c.settings.onsubmit && (this.validateDelegate(":submit", "click", function (b) {
                c.settings.submitHandler && (c.submitButton = b.target), a(b.target).hasClass("cancel") && (c.cancelSubmit = !0), void 0 !== a(b.target).attr("formnovalidate") && (c.cancelSubmit = !0)
            }), this.submit(function (b) {
                function d() {
                    var d;
                    return c.settings.submitHandler ? (c.submitButton && (d = a("<input type='hidden'/>").attr("name", c.submitButton.name).val(a(c.submitButton).val()).appendTo(c.currentForm)), c.settings.submitHandler.call(c, c.currentForm, b), c.submitButton && d.remove(), !1) : !0
                }

                return c.settings.debug && b.preventDefault(), c.cancelSubmit ? (c.cancelSubmit = !1, d()) : c.form() ? c.pendingRequest ? (c.formSubmitted = !0, !1) : d() : (c.focusInvalid(), !1)
            })), c)
        }, valid: function () {
            var b, c;
            return a(this[0]).is("form") ? b = this.validate().form() : (b = !0, c = a(this[0].form).validate(), this.each(function () {
                b = c.element(this) && b
            })), b
        }, removeAttrs: function (b) {
            var c = {}, d = this;
            return a.each(b.split(/\s/), function (a, b) {
                c[b] = d.attr(b), d.removeAttr(b)
            }), c
        }, rules: function (b, c) {
            var d, e, f, g, h, i, j = this[0];
            if (b) switch (d = a.data(j.form, "validator").settings, e = d.rules, f = a.validator.staticRules(j), b) {
                case"add":
                    a.extend(f, a.validator.normalizeRule(c)), delete f.messages, e[j.name] = f, c.messages && (d.messages[j.name] = a.extend(d.messages[j.name], c.messages));
                    break;
                case"remove":
                    return c ? (i = {}, a.each(c.split(/\s/), function (b, c) {
                        i[c] = f[c], delete f[c], "required" === c && a(j).removeAttr("aria-required")
                    }), i) : (delete e[j.name], f)
            }
            return g = a.validator.normalizeRules(a.extend({}, a.validator.classRules(j), a.validator.attributeRules(j), a.validator.dataRules(j), a.validator.staticRules(j)), j), g.required && (h = g.required, delete g.required, g = a.extend({required: h}, g), a(j).attr("aria-required", "true")), g.remote && (h = g.remote, delete g.remote, g = a.extend(g, {remote: h})), g
        }
    }), a.extend(a.expr[":"], {
        blank: function (b) {
            return !a.trim("" + a(b).val())
        }, filled: function (b) {
            return !!a.trim("" + a(b).val())
        }, unchecked: function (b) {
            return !a(b).prop("checked")
        }
    }), a.validator = function (b, c) {
        this.settings = a.extend(!0, {}, a.validator.defaults, b), this.currentForm = c, this.init()
    }, a.validator.format = function (b, c) {
        return 1 === arguments.length ? function () {
            var c = a.makeArray(arguments);
            return c.unshift(b), a.validator.format.apply(this, c)
        } : (arguments.length > 2 && c.constructor !== Array && (c = a.makeArray(arguments).slice(1)), c.constructor !== Array && (c = [c]), a.each(c, function (a, c) {
            b = b.replace(new RegExp("\\{" + a + "\\}", "g"), function () {
                return c
            })
        }), b)
    }, a.extend(a.validator, {
        defaults: {
            messages: {},
            groups: {},
            rules: {},
            errorClass: "error",
            validClass: "valid",
            errorElement: "label",
            focusInvalid: !0,
            errorContainer: a([]),
            errorLabelContainer: a([]),
            onsubmit: !0,
            ignore: ":hidden",
            ignoreTitle: !1,
            onfocusin: function (a) {
                this.lastActive = a, this.settings.focusCleanup && !this.blockFocusCleanup && (this.settings.unhighlight && this.settings.unhighlight.call(this, a, this.settings.errorClass, this.settings.validClass), this.addWrapper(this.errorsFor(a)).hide())
            },
            onfocusout: function (a) {
                this.checkable(a) || !(a.name in this.submitted) && this.optional(a) || this.element(a)
            },
            onkeyup: function (a, b) {
                (9 !== b.which || "" !== this.elementValue(a)) && (a.name in this.submitted || a === this.lastElement) && this.element(a)
            },
            onclick: function (a) {
                a.name in this.submitted ? this.element(a) : a.parentNode.name in this.submitted && this.element(a.parentNode)
            },
            highlight: function (b, c, d) {
                "radio" === b.type ? this.findByName(b.name).addClass(c).removeClass(d) : a(b).addClass(c).removeClass(d)
            },
            unhighlight: function (b, c, d) {
                "radio" === b.type ? this.findByName(b.name).removeClass(c).addClass(d) : a(b).removeClass(c).addClass(d)
            }
        },
        setDefaults: function (b) {
            a.extend(a.validator.defaults, b)
        },
        messages: {
            required: "This field is required.",
            remote: "Please fix this field.",
            email: "Please enter a valid email address.",
            url: "Please enter a valid URL.",
            date: "Please enter a valid date.",
            dateISO: "Please enter a valid date (ISO).",
            number: "Please enter a valid number.",
            digits: "Please enter only digits.",
            creditcard: "Please enter a valid credit card number.",
            equalTo: "Please enter the same value again.",
            maxlength: a.validator.format("Please enter no more than {0} characters."),
            minlength: a.validator.format("Please enter at least {0} characters."),
            rangelength: a.validator.format("Please enter a value between {0} and {1} characters long."),
            range: a.validator.format("Please enter a value between {0} and {1}."),
            max: a.validator.format("Please enter a value less than or equal to {0}."),
            min: a.validator.format("Please enter a value greater than or equal to {0}.")
        },
        autoCreateRanges: !1,
        prototype: {
            init: function () {
                function b(b) {
                    var c = a.data(this[0].form, "validator"), d = "on" + b.type.replace(/^validate/, ""),
                        e = c.settings;
                    e[d] && !this.is(e.ignore) && e[d].call(c, this[0], b)
                }

                this.labelContainer = a(this.settings.errorLabelContainer), this.errorContext = this.labelContainer.length && this.labelContainer || a(this.currentForm), this.containers = a(this.settings.errorContainer).add(this.settings.errorLabelContainer), this.submitted = {}, this.valueCache = {}, this.pendingRequest = 0, this.pending = {}, this.invalid = {}, this.reset();
                var c, d = this.groups = {};
                a.each(this.settings.groups, function (b, c) {
                    "string" == typeof c && (c = c.split(/\s/)), a.each(c, function (a, c) {
                        d[c] = b
                    })
                }), c = this.settings.rules, a.each(c, function (b, d) {
                    c[b] = a.validator.normalizeRule(d)
                }), a(this.currentForm).validateDelegate(":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'] ,[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], [type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'] ", "focusin focusout keyup", b).validateDelegate("[type='radio'], [type='checkbox'], select, option", "click", b), this.settings.invalidHandler && a(this.currentForm).bind("invalid-form.validate", this.settings.invalidHandler), a(this.currentForm).find("[required], [data-rule-required], .required").attr("aria-required", "true")
            }, form: function () {
                return this.checkForm(), a.extend(this.submitted, this.errorMap), this.invalid = a.extend({}, this.errorMap), this.valid() || a(this.currentForm).triggerHandler("invalid-form", [this]), this.showErrors(), this.valid()
            }, checkForm: function () {
                this.prepareForm();
                for (var a = 0, b = this.currentElements = this.elements(); b[a]; a++) this.check(b[a]);
                return this.valid()
            }, element: function (b) {
                var c = this.clean(b), d = this.validationTargetFor(c), e = !0;
                return this.lastElement = d, void 0 === d ? delete this.invalid[c.name] : (this.prepareElement(d), this.currentElements = a(d), e = this.check(d) !== !1, e ? delete this.invalid[d.name] : this.invalid[d.name] = !0), a(b).attr("aria-invalid", !e), this.numberOfInvalids() || (this.toHide = this.toHide.add(this.containers)), this.showErrors(), e
            }, showErrors: function (b) {
                if (b) {
                    a.extend(this.errorMap, b), this.errorList = [];
                    for (var c in b) this.errorList.push({message: b[c], element: this.findByName(c)[0]});
                    this.successList = a.grep(this.successList, function (a) {
                        return !(a.name in b)
                    })
                }
                this.settings.showErrors ? this.settings.showErrors.call(this, this.errorMap, this.errorList) : this.defaultShowErrors()
            }, resetForm: function () {
                a.fn.resetForm && a(this.currentForm).resetForm(), this.submitted = {}, this.lastElement = null, this.prepareForm(), this.hideErrors(), this.elements().removeClass(this.settings.errorClass).removeData("previousValue").removeAttr("aria-invalid")
            }, numberOfInvalids: function () {
                return this.objectLength(this.invalid)
            }, objectLength: function (a) {
                var b, c = 0;
                for (b in a) c++;
                return c
            }, hideErrors: function () {
                this.addWrapper(this.toHide).hide()
            }, valid: function () {
                return 0 === this.size()
            }, size: function () {
                return this.errorList.length
            }, focusInvalid: function () {
                if (this.settings.focusInvalid) try {
                    a(this.findLastActive() || this.errorList.length && this.errorList[0].element || []).filter(":visible").focus().trigger("focusin")
                } catch (b) {
                }
            }, findLastActive: function () {
                var b = this.lastActive;
                return b && 1 === a.grep(this.errorList, function (a) {
                    return a.element.name === b.name
                }).length && b
            }, elements: function () {
                var b = this, c = {};
                return a(this.currentForm).find("input, select, textarea").not(":submit, :reset, :image, [disabled]").not(this.settings.ignore).filter(function () {
                    return !this.name && b.settings.debug && window.console && console.error("%o has no name assigned", this), this.name in c || !b.objectLength(a(this).rules()) ? !1 : (c[this.name] = !0, !0)
                })
            }, clean: function (b) {
                return a(b)[0]
            }, errors: function () {
                var b = this.settings.errorClass.split(" ").join(".");
                return a(this.settings.errorElement + "." + b, this.errorContext)
            }, reset: function () {
                this.successList = [], this.errorList = [], this.errorMap = {}, this.toShow = a([]), this.toHide = a([]), this.currentElements = a([])
            }, prepareForm: function () {
                this.reset(), this.toHide = this.errors().add(this.containers)
            }, prepareElement: function (a) {
                this.reset(), this.toHide = this.errorsFor(a)
            }, elementValue: function (b) {
                var c, d = a(b), e = d.attr("type");
                return "radio" === e || "checkbox" === e ? a("input[name='" + d.attr("name") + "']:checked").val() : (c = d.val(), "string" == typeof c ? c.replace(/\r/g, "") : c)
            }, check: function (b) {
                b = this.validationTargetFor(this.clean(b));
                var c, d, e, f = a(b).rules(), g = a.map(f, function (a, b) {
                    return b
                }).length, h = !1, i = this.elementValue(b);
                for (d in f) {
                    e = {method: d, parameters: f[d]};
                    try {
                        if (c = a.validator.methods[d].call(this, i, b, e.parameters), "dependency-mismatch" === c && 1 === g) {
                            h = !0;
                            continue
                        }
                        if (h = !1, "pending" === c) return void (this.toHide = this.toHide.not(this.errorsFor(b)));
                        if (!c) return this.formatAndAdd(b, e), !1
                    } catch (j) {
                        throw this.settings.debug && window.console && console.log("Exception occurred when checking element " + b.id + ", check the '" + e.method + "' method.", j), j
                    }
                }
                if (!h) return this.objectLength(f) && this.successList.push(b), !0
            }, customDataMessage: function (b, c) {
                return a(b).data("msg" + c[0].toUpperCase() + c.substring(1).toLowerCase()) || a(b).data("msg")
            }, customMessage: function (a, b) {
                var c = this.settings.messages[a];
                return c && (c.constructor === String ? c : c[b])
            }, findDefined: function () {
                for (var a = 0; a < arguments.length; a++) if (void 0 !== arguments[a]) return arguments[a];
                return void 0
            }, defaultMessage: function (b, c) {
                return this.findDefined(this.customMessage(b.name, c), this.customDataMessage(b, c), !this.settings.ignoreTitle && b.title || void 0, a.validator.messages[c], "<strong>Warning: No message defined for " + b.name + "</strong>")
            }, formatAndAdd: function (b, c) {
                var d = this.defaultMessage(b, c.method), e = /\$?\{(\d+)\}/g;
                "function" == typeof d ? d = d.call(this, c.parameters, b) : e.test(d) && (d = a.validator.format(d.replace(e, "{$1}"), c.parameters)), this.errorList.push({
                    message: d,
                    element: b,
                    method: c.method
                }), this.errorMap[b.name] = d, this.submitted[b.name] = d
            }, addWrapper: function (a) {
                return this.settings.wrapper && (a = a.add(a.parent(this.settings.wrapper))), a
            }, defaultShowErrors: function () {
                var a, b, c;
                for (a = 0; this.errorList[a]; a++) c = this.errorList[a], this.settings.highlight && this.settings.highlight.call(this, c.element, this.settings.errorClass, this.settings.validClass), this.showLabel(c.element, c.message);
                if (this.errorList.length && (this.toShow = this.toShow.add(this.containers)), this.settings.success) for (a = 0; this.successList[a]; a++) this.showLabel(this.successList[a]);
                if (this.settings.unhighlight) for (a = 0, b = this.validElements(); b[a]; a++) this.settings.unhighlight.call(this, b[a], this.settings.errorClass, this.settings.validClass);
                this.toHide = this.toHide.not(this.toShow), this.hideErrors(), this.addWrapper(this.toShow).show()
            }, validElements: function () {
                return this.currentElements.not(this.invalidElements())
            }, invalidElements: function () {
                return a(this.errorList).map(function () {
                    return this.element
                })
            }, showLabel: function (b, c) {
                var d = this.errorsFor(b);
                d.length ? (d.removeClass(this.settings.validClass).addClass(this.settings.errorClass), d.html(c)) : (d = a("<" + this.settings.errorElement + ">").attr("for", this.idOrName(b)).addClass(this.settings.errorClass).html(c || ""), this.settings.wrapper && (d = d.hide().show().wrap("<" + this.settings.wrapper + "/>").parent()), this.labelContainer.append(d).length || (this.settings.errorPlacement ? this.settings.errorPlacement(d, a(b)) : d.insertAfter(b))), !c && this.settings.success && (d.text(""), "string" == typeof this.settings.success ? d.addClass(this.settings.success) : this.settings.success(d, b)), this.toShow = this.toShow.add(d)
            }, errorsFor: function (b) {
                var c = this.idOrName(b);
                return this.errors().filter(function () {
                    return a(this).attr("for") === c
                })
            }, idOrName: function (a) {
                return this.groups[a.name] || (this.checkable(a) ? a.name : a.id || a.name)
            }, validationTargetFor: function (a) {
                return this.checkable(a) && (a = this.findByName(a.name).not(this.settings.ignore)[0]), a
            }, checkable: function (a) {
                return /radio|checkbox/i.test(a.type)
            }, findByName: function (b) {
                return a(this.currentForm).find("[name='" + b + "']")
            }, getLength: function (b, c) {
                switch (c.nodeName.toLowerCase()) {
                    case"select":
                        return a("option:selected", c).length;
                    case"input":
                        if (this.checkable(c)) return this.findByName(c.name).filter(":checked").length
                }
                return b.length
            }, depend: function (a, b) {
                return this.dependTypes[typeof a] ? this.dependTypes[typeof a](a, b) : !0
            }, dependTypes: {
                "boolean": function (a) {
                    return a
                }, string: function (b, c) {
                    return !!a(b, c.form).length
                }, "function": function (a, b) {
                    return a(b)
                }
            }, optional: function (b) {
                var c = this.elementValue(b);
                return !a.validator.methods.required.call(this, c, b) && "dependency-mismatch"
            }, startRequest: function (a) {
                this.pending[a.name] || (this.pendingRequest++, this.pending[a.name] = !0)
            }, stopRequest: function (b, c) {
                this.pendingRequest--, this.pendingRequest < 0 && (this.pendingRequest = 0), delete this.pending[b.name], c && 0 === this.pendingRequest && this.formSubmitted && this.form() ? (a(this.currentForm).submit(), this.formSubmitted = !1) : !c && 0 === this.pendingRequest && this.formSubmitted && (a(this.currentForm).triggerHandler("invalid-form", [this]), this.formSubmitted = !1)
            }, previousValue: function (b) {
                return a.data(b, "previousValue") || a.data(b, "previousValue", {
                    old: null,
                    valid: !0,
                    message: this.defaultMessage(b, "remote")
                })
            }
        },
        classRuleSettings: {
            required: {required: !0},
            email: {email: !0},
            url: {url: !0},
            date: {date: !0},
            dateISO: {dateISO: !0},
            number: {number: !0},
            digits: {digits: !0},
            creditcard: {creditcard: !0}
        },
        addClassRules: function (b, c) {
            b.constructor === String ? this.classRuleSettings[b] = c : a.extend(this.classRuleSettings, b)
        },
        classRules: function (b) {
            var c = {}, d = a(b).attr("class");
            return d && a.each(d.split(" "), function () {
                this in a.validator.classRuleSettings && a.extend(c, a.validator.classRuleSettings[this])
            }), c
        },
        attributeRules: function (b) {
            var c, d, e = {}, f = a(b), g = b.getAttribute("type");
            for (c in a.validator.methods) "required" === c ? (d = b.getAttribute(c), "" === d && (d = !0), d = !!d) : d = f.attr(c), /min|max/.test(c) && (null === g || /number|range|text/.test(g)) && (d = Number(d)), d || 0 === d ? e[c] = d : g === c && "range" !== g && (e[c] = !0);
            return e.maxlength && /-1|2147483647|524288/.test(e.maxlength) && delete e.maxlength, e
        },
        dataRules: function (b) {
            var c, d, e = {}, f = a(b);
            for (c in a.validator.methods) d = f.data("rule" + c[0].toUpperCase() + c.substring(1).toLowerCase()), void 0 !== d && (e[c] = d);
            return e
        },
        staticRules: function (b) {
            var c = {}, d = a.data(b.form, "validator");
            return d.settings.rules && (c = a.validator.normalizeRule(d.settings.rules[b.name]) || {}), c
        },
        normalizeRules: function (b, c) {
            return a.each(b, function (d, e) {
                if (e === !1) return void delete b[d];
                if (e.param || e.depends) {
                    var f = !0;
                    switch (typeof e.depends) {
                        case"string":
                            f = !!a(e.depends, c.form).length;
                            break;
                        case"function":
                            f = e.depends.call(c, c)
                    }
                    f ? b[d] = void 0 !== e.param ? e.param : !0 : delete b[d]
                }
            }), a.each(b, function (d, e) {
                b[d] = a.isFunction(e) ? e(c) : e
            }), a.each(["minlength", "maxlength"], function () {
                b[this] && (b[this] = Number(b[this]))
            }), a.each(["rangelength", "range"], function () {
                var c;
                b[this] && (a.isArray(b[this]) ? b[this] = [Number(b[this][0]), Number(b[this][1])] : "string" == typeof b[this] && (c = b[this].split(/[\s,]+/), b[this] = [Number(c[0]), Number(c[1])]))
            }), a.validator.autoCreateRanges && (b.min && b.max && (b.range = [b.min, b.max], delete b.min, delete b.max), b.minlength && b.maxlength && (b.rangelength = [b.minlength, b.maxlength], delete b.minlength, delete b.maxlength)), b
        },
        normalizeRule: function (b) {
            if ("string" == typeof b) {
                var c = {};
                a.each(b.split(/\s/), function () {
                    c[this] = !0
                }), b = c
            }
            return b
        },
        addMethod: function (b, c, d) {
            a.validator.methods[b] = c, a.validator.messages[b] = void 0 !== d ? d : a.validator.messages[b], c.length < 3 && a.validator.addClassRules(b, a.validator.normalizeRule(b))
        },
        methods: {
            required: function (b, c, d) {
                if (!this.depend(d, c)) return "dependency-mismatch";
                if ("select" === c.nodeName.toLowerCase()) {
                    var e = a(c).val();
                    return e && e.length > 0
                }
                return this.checkable(c) ? this.getLength(b, c) > 0 : a.trim(b).length > 0
            }, email: function (a, b) {
                return this.optional(b) || /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(a)
            }, url: function (a, b) {
                return this.optional(b) || /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(a)
            }, date: function (a, b) {
                return this.optional(b) || !/Invalid|NaN/.test(new Date(a).toString())
            }, dateISO: function (a, b) {
                return this.optional(b) || /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(a)
            }, number: function (a, b) {
                return this.optional(b) || /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(a)
            }, digits: function (a, b) {
                return this.optional(b) || /^\d+$/.test(a)
            }, creditcard: function (a, b) {
                if (this.optional(b)) return "dependency-mismatch";
                if (/[^0-9 \-]+/.test(a)) return !1;
                var c, d, e = 0, f = 0, g = !1;
                if (a = a.replace(/\D/g, ""), a.length < 13 || a.length > 19) return !1;
                for (c = a.length - 1; c >= 0; c--) d = a.charAt(c), f = parseInt(d, 10), g && (f *= 2) > 9 && (f -= 9), e += f, g = !g;
                return e % 10 === 0
            }, minlength: function (b, c, d) {
                var e = a.isArray(b) ? b.length : this.getLength(a.trim(b), c);
                return this.optional(c) || e >= d
            }, maxlength: function (b, c, d) {
                var e = a.isArray(b) ? b.length : this.getLength(a.trim(b), c);
                return this.optional(c) || d >= e
            }, rangelength: function (b, c, d) {
                var e = a.isArray(b) ? b.length : this.getLength(a.trim(b), c);
                return this.optional(c) || e >= d[0] && e <= d[1]
            }, min: function (a, b, c) {
                return this.optional(b) || a >= c
            }, max: function (a, b, c) {
                return this.optional(b) || c >= a
            }, range: function (a, b, c) {
                return this.optional(b) || a >= c[0] && a <= c[1]
            }, equalTo: function (b, c, d) {
                var e = a(d);
                return this.settings.onfocusout && e.unbind(".validate-equalTo").bind("blur.validate-equalTo", function () {
                    a(c).valid()
                }), b === e.val()
            }, remote: function (b, c, d) {
                if (this.optional(c)) return "dependency-mismatch";
                var e, f, g = this.previousValue(c);
                return this.settings.messages[c.name] || (this.settings.messages[c.name] = {}), g.originalMessage = this.settings.messages[c.name].remote, this.settings.messages[c.name].remote = g.message, d = "string" == typeof d && {url: d} || d, g.old === b ? g.valid : (g.old = b, e = this, this.startRequest(c), f = {}, f[c.name] = b, a.ajax(a.extend(!0, {
                    url: d,
                    mode: "abort",
                    port: "validate" + c.name,
                    dataType: "json",
                    data: f,
                    context: e.currentForm,
                    success: function (d) {
                        var f, h, i, j = d === !0 || "true" === d;
                        e.settings.messages[c.name].remote = g.originalMessage, j ? (i = e.formSubmitted, e.prepareElement(c), e.formSubmitted = i, e.successList.push(c), delete e.invalid[c.name], e.showErrors()) : (f = {}, h = d || e.defaultMessage(c, "remote"), f[c.name] = g.message = a.isFunction(h) ? h(b) : h, e.invalid[c.name] = !0, e.showErrors(f)), g.valid = j, e.stopRequest(c, j)
                    }
                }, d)), "pending")
            }
        }
    }), a.format = function () {
        throw"$.format has been deprecated. Please use $.validator.format instead."
    }
}(jQuery), function (a) {
    var b, c = {};
    a.ajaxPrefilter ? a.ajaxPrefilter(function (a, b, d) {
        var e = a.port;
        "abort" === a.mode && (c[e] && c[e].abort(), c[e] = d)
    }) : (b = a.ajax, a.ajax = function (d) {
        var e = ("mode" in d ? d : a.ajaxSettings).mode, f = ("port" in d ? d : a.ajaxSettings).port;
        return "abort" === e ? (c[f] && c[f].abort(), c[f] = b.apply(this, arguments), c[f]) : b.apply(this, arguments)
    })
}(jQuery), function (a) {
    a.extend(a.fn, {
        validateDelegate: function (b, c, d) {
            return this.bind(c, function (c) {
                var e = a(c.target);
                return e.is(b) ? d.apply(e, arguments) : void 0
            })
        }
    })
}(jQuery);


/*
The MIT License (MIT)

Copyright (c) 2014 Phil Hughes

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
(function () {
    var a = function (a, b) {
        return function () {
            return a.apply(b, arguments)
        }
    };
    !function (b, c) {
        var d, e, f;
        e = function () {
            function c(c) {
                this.element = c, this._clickEvent = a(this._clickEvent, this), this.element = b(this.element), this.nav = this.element.closest(".nav"), this.dropdown = this.element.parent().find(".dropdown-menu"), this.element.on("click", this._clickEvent), this.nav.closest(".navbar-offcanvas").on("click", function (a) {
                    return function () {
                        if (a.dropdown.is(".shown")) return a.dropdown.removeClass("shown").closest(".open").removeClass("open")
                    }
                }(this))
            }

            return c.prototype._clickEvent = function (a) {
                return this.dropdown.hasClass("shown") || a.preventDefault(), a.stopPropagation(), b(".dropdown-toggle").not(this.element).closest(".open").removeClass("open").find(".dropdown-menu").removeClass("shown"), this.dropdown.toggleClass("shown"), this.element.parent().toggleClass("open")
            }, c
        }(), f = function () {
            function d(c, d, e, f) {
                this.button = c, this.element = d, this.location = e, this.offcanvas = f, this._getFade = a(this._getFade, this), this._getCss = a(this._getCss, this), this._touchEnd = a(this._touchEnd, this), this._touchMove = a(this._touchMove, this), this._touchStart = a(this._touchStart, this), this.endThreshold = 130, this.startThreshold = this.element.hasClass("navbar-offcanvas-right") ? b("body").outerWidth() - 60 : 20, this.maxStartThreshold = this.element.hasClass("navbar-offcanvas-right") ? b("body").outerWidth() - 20 : 60, this.currentX = 0, this.fade = !!this.element.hasClass("navbar-offcanvas-fade"), b(document).on("touchstart", this._touchStart), b(document).on("touchmove", this._touchMove), b(document).on("touchend", this._touchEnd)
            }

            return d.prototype._touchStart = function (a) {
                if (this.startX = a.originalEvent.touches[0].pageX, this.element.is(".in")) return this.element.height(b(c).outerHeight())
            }, d.prototype._touchMove = function (a) {
                var c;
                if (b(a.target).parents(".navbar-offcanvas").length > 0) return !0;
                if (this.startX > this.startThreshold && this.startX < this.maxStartThreshold) {
                    if (a.preventDefault(), c = a.originalEvent.touches[0].pageX - this.startX, c = this.element.hasClass("navbar-offcanvas-right") ? -c : c, Math.abs(c) < this.element.outerWidth()) return this.element.css(this._getCss(c)), this.element.css(this._getFade(c))
                } else if (this.element.hasClass("in") && (a.preventDefault(), c = a.originalEvent.touches[0].pageX + (this.currentX - this.startX), c = this.element.hasClass("navbar-offcanvas-right") ? -c : c, Math.abs(c) < this.element.outerWidth())) return this.element.css(this._getCss(c)), this.element.css(this._getFade(c))
            }, d.prototype._touchEnd = function (a) {
                var c, d, e;
                return b(a.target).parents(".navbar-offcanvas").length > 0 || (d = !1, e = a.originalEvent.changedTouches[0].pageX, Math.abs(e) !== this.startX ? (c = this.element.hasClass("navbar-offcanvas-right") ? Math.abs(e) > this.endThreshold + 50 : e < this.endThreshold + 50, this.element.hasClass("in") && c ? (this.currentX = 0, this.element.removeClass("in").css(this._clearCss()), this.button.removeClass("is-open"), d = !0) : Math.abs(e - this.startX) > this.endThreshold && this.startX > this.startThreshold && this.startX < this.maxStartThreshold ? (this.currentX = this.element.hasClass("navbar-offcanvas-right") ? -this.element.outerWidth() : this.element.outerWidth(), this.element.toggleClass("in").css(this._clearCss()), this.button.toggleClass("is-open"), d = !0) : this.element.css(this._clearCss()), this.offcanvas.bodyOverflow(d)) : void 0)
            }, d.prototype._getCss = function (a) {
                return a = this.element.hasClass("navbar-offcanvas-right") ? -a : a, {
                    "-webkit-transform": "translate3d(" + a + "px, 0px, 0px)",
                    "-webkit-transition-duration": "0s",
                    "-moz-transform": "translate3d(" + a + "px, 0px, 0px)",
                    "-moz-transition": "0s",
                    "-o-transform": "translate3d(" + a + "px, 0px, 0px)",
                    "-o-transition": "0s",
                    transform: "translate3d(" + a + "px, 0px, 0px)",
                    transition: "0s"
                }
            }, d.prototype._getFade = function (a) {
                return this.fade ? {opacity: a / this.element.outerWidth()} : {}
            }, d.prototype._clearCss = function () {
                return {
                    "-webkit-transform": "",
                    "-webkit-transition-duration": "",
                    "-moz-transform": "",
                    "-moz-transition": "",
                    "-o-transform": "",
                    "-o-transition": "",
                    transform: "",
                    transition: "",
                    opacity: ""
                }
            }, d
        }(), c.Offcanvas = d = function () {
            function d(c) {
                var d;
                this.element = c, this.bodyOverflow = a(this.bodyOverflow, this), this._sendEventsAfter = a(this._sendEventsAfter, this), this._sendEventsBefore = a(this._sendEventsBefore, this), this._documentClicked = a(this._documentClicked, this), this._close = a(this._close, this), this._open = a(this._open, this), this._clicked = a(this._clicked, this), this._navbarHeight = a(this._navbarHeight, this), d = !!this.element.attr("data-target") && this.element.attr("data-target"), d ? (this.target = b(d), this.target.length && !this.target.hasClass("js-offcanvas-done") && (this.element.addClass("js-offcanvas-has-events"), this.location = this.target.hasClass("navbar-offcanvas-right") ? "right" : "left", this.target.addClass(this._transformSupported() ? "offcanvas-transform js-offcanvas-done" : "offcanvas-position js-offcanvas-done"), this.target.data("offcanvas", this), this.element.on("click", this._clicked), this.target.on("transitionend", function (a) {
                    return function () {
                        if (a.target.is(":not(.in)")) return a.target.height("")
                    }
                }(this)), b(document).on("click", this._documentClicked), this.target.hasClass("navbar-offcanvas-touch") && new f(this.element, this.target, this.location, this), this.target.find(".dropdown-toggle").each(function () {
                    return new e(this)
                }), this.target.on("offcanvas.toggle", function (a) {
                    return function (b) {
                        return a._clicked(b)
                    }
                }(this)), this.target.on("offcanvas.close", function (a) {
                    return function (b) {
                        return a._close(b)
                    }
                }(this)), this.target.on("offcanvas.open", function (a) {
                    return function (b) {
                        return a._open(b)
                    }
                }(this)))) : console.warn("Offcanvas: `data-target` attribute must be present.")
            }

            return d.prototype._navbarHeight = function () {
                if (this.target.is(".in")) return this.target.height(b(c).outerHeight())
            }, d.prototype._clicked = function (a) {
                return a.preventDefault(), this._sendEventsBefore(), b(".navbar-offcanvas").not(this.target).trigger("offcanvas.close"), this.target.toggleClass("in"), this.element.toggleClass("is-open"), this._navbarHeight(), this.bodyOverflow()
            }, d.prototype._open = function (a) {
                if (a.preventDefault(), !this.target.is(".in")) return this._sendEventsBefore(), this.target.addClass("in"), this.element.addClass("is-open"), this._navbarHeight(), this.bodyOverflow()
            }, d.prototype._close = function (a) {
                if (a.preventDefault(), !this.target.is(":not(.in)")) return this._sendEventsBefore(), this.target.removeClass("in"), this.element.removeClass("is-open"), this._navbarHeight(), this.bodyOverflow()
            }, d.prototype._documentClicked = function (a) {
                var c;
                if (c = b(a.target), !c.hasClass("offcanvas-toggle") && 0 === c.parents(".offcanvas-toggle").length && 0 === c.parents(".navbar-offcanvas").length && !c.hasClass("navbar-offcanvas") && this.target.hasClass("in")) return a.preventDefault(), this._sendEventsBefore(), this.target.removeClass("in"), this.element.removeClass("is-open"), this._navbarHeight(), this.bodyOverflow()
            }, d.prototype._sendEventsBefore = function () {
                return this.target.hasClass("in") ? this.target.trigger("hide.bs.offcanvas") : this.target.trigger("show.bs.offcanvas")
            }, d.prototype._sendEventsAfter = function () {
                return this.target.hasClass("in") ? this.target.trigger("shown.bs.offcanvas") : this.target.trigger("hidden.bs.offcanvas")
            }, d.prototype.bodyOverflow = function (a) {
                if (null == a && (a = !0), this.target.is(".in") ? b("body").addClass("offcanvas-stop-scrolling") : b("body").removeClass("offcanvas-stop-scrolling"), a) return this._sendEventsAfter()
            }, d.prototype._transformSupported = function () {
                var a, b, c, d;
                return b = document.createElement("div"), d = "translate3d(0px, 0px, 0px)", c = /translate3d\(0px, 0px, 0px\)/g, b.style.cssText = "-webkit-transform: " + d + "; -moz-transform: " + d + "; -o-transform: " + d + "; transform: " + d, a = b.style.cssText.match(c), null != a.length
            }, d
        }(), b.fn.bsOffcanvas = function () {
            return this.each(function () {
                return new d(b(this))
            })
        }, b(function () {
            return b('[data-toggle="offcanvas"]').each(function () {
                return b(this).bsOffcanvas()
            }), b(c).on("resize", function () {
                return b(".navbar-offcanvas.in").each(function () {
                    return b(this).height("").removeClass("in")
                }), b(".offcanvas-toggle").removeClass("is-open"), b("body").removeClass("offcanvas-stop-scrolling")
            }), b(".offcanvas-toggle").each(function () {
                return b(this).on("click", function (a) {
                    var c, d;
                    if (!b(this).hasClass("js-offcanvas-has-events") && (d = b(this).attr("data-target"), c = b(d))) return c.height(""), c.removeClass("in"), b("body").css({
                        overflow: "",
                        position: ""
                    })
                })
            })
        })
    }(window.jQuery, window)
}).call(this);


/*!
 * jQuery Input Ip Address Control : v0.1beta (2010/11/09 16:15:43)
 * Copyright (c) 2010 jquery-input-ip-address-control@googlecode.com
 * Licensed under the MIT license and GPL licenses.
 *
 */
eval(function (p, a, c, k, e, d) {
    e = function (c) {
        return (c < a ? '' : e(parseInt(c / a))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36))
    };
    if (!''.replace(/^/, String)) {
        while (c--) {
            d[e(c)] = k[c] || e(c)
        }
        k = [function (e) {
            return d[e]
        }];
        e = function () {
            return '\\w+'
        };
        c = 1
    }

    while (c--) {
        if (k[c]) {
            p = p.replace(new RegExp('\\b' + e(c) + '\\b', 'g'), k[c])
        }
    }
    return p
}('(l($){Q.1o.1t=l(){E=/\\b(?:(?:25[0-5]|2[0-4][0-9]|[1m]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[1m]?[0-9][0-9]?)\\b/;h E.1a(p.1i())};Q.1o.1S=l(){E=/\\b([A-16-9]{1,4}:){7}([A-16-9]{1,4})\\b/i;h E.1a(p.1i())};$.1X.1h({y:l(u,c){f(p.z==0)h;f(1k u==\'1f\'){c=(1k c==\'1f\')?c:u;h p.1d(l(){f(p.18){p.1s();p.18(u,c)}w f(p.1e){t C=p.1e();C.1L(S);C.1z(\'10\',c);C.1b(\'10\',u);C.1w()}})}w{f(p[0].18){u=p[0].1u;c=p[0].1C}w f(14.12&&14.12.19){t C=14.12.19();u=0-C.1D().1b(\'10\',-1E);c=u+C.1H.z}h{u:u,c:c}}},1B:l(s){s=$.1h({v:4},s);f(s.v==4){s.W=M I(\'[0-9]\',\'g\');s.r=\'R.R.R.R\'}f(s.v==6){s.W=M I(\'[A-16-9]\',\'1x\');s.r=\'x:x:x:x:x:x:x:x\'}s.D=s.r.K(\'\').Y();s.q=s.r.X(M I(s.D,\'g\'),\'\').K(\'\').Y();s.O=s.r.K(s.q).Y();h $(p).1d(l(){t a={k:T,n:T,o:T,d:T};a.d=$(p);f(a.d.m()==\'\'||!J(a.d.m()))a.d.m(s.r);a.d.1j(\'1Z\',(s.v==4?15:1c)).1j(\'1W\',(s.v==4?15:1c));l J(o){h 24("o.21"+s.v+"()")};l P(){a.k=a.d.y();a.o=J(L(a.d.m()))?L(a.d.m()):a.o;a.n=a.d.m().K(\'\')};l 1n(o){t G=o.K(s.q);1p(t j=0;j<G.z;j++){1M((s.O.z-G[j].z)>0)G[j]+=s.D}h G.H(s.q)};l L(o){t E=M I(s.O,\'g\');t 1g=M I(s.D,\'g\');h o.X(E,\'0\').X(1g,\'\')};l 11(e){1R(e.1Q){U 8:f(a.n[a.k.c-1]!=s.q){a.n[a.k.c-1]=s.D;a.d.m(a.n.H("")).m()}a.d.y(a.k.c-1);h B;V;U 13:U 1T:a.d.17();V;U 1P:f(a.n[a.k.c]!=s.q&&a.k.c<s.r.z){a.n[a.k.c]=s.D;a.d.m(a.n.H(""))}f(a.k.c<s.r.z)a.d.y(a.k.c+1);h B;V}h S};a.d.N(\'1O\',l(e){P();f($.1l.1K||$.1l.1V){h 11(e)}}).N(\'1U\',l(e){P();f(e.23||e.22||e.1Y)h S;w f((e.F>=20&&e.F<=1N)||e.F>1J){f(Q.1q(e.F).1y(s.W)){a.n[a.k.c]=Q.1q(e.F);f(!J(L(a.n.H(\'\')))){f((a.k.c==0||a.n[a.k.c-1]==s.q)){1p(t i=a.k.c+1;i<a.k.c+s.O.z;i++){a.n[i]=s.D}}w h B}a.d.m(a.n.H(\'\'));f(a.n[a.k.c+1]==s.q){a.d.y(a.k.c+2)}w{a.d.y(a.k.c+1)}h B}w f(s.q.1v(0)==e.F){t Z=a.d.m().1A(s.q,a.k.c);f(Z==-1)h B;f(a.n[a.k.c-1]==s.q)h B;a.k.c=Z;a.d.y(a.k.c+1);h B}w h B}h 11(e)}).N(\'17\',l(){f(a.d.m()==s.r)h S;t o=L($.1G(a.d.m()));f(J(o))a.d.m(o);w a.d.m(a.o)}).N(\'1s\',l(){1r(l(){P();f(a.d.m()!=s.r)a.d.m(1n(a.o));a.d.y(0)},0)}).N(\'1I\',l(e){a.d.m(\'\');1r(l(){a.d.17()},0)})})}})})(1F);', 62, 130, '||||||||||ctx||end|input||if||return|||cursor|function|val|buffer|ip|this|separator|label||var|begin||else|____|caret|length||false|range|place|rgx|which|part|join|RegExp|isIp|split|unmask|new|bind|partplace|loadCtx|String|___|true|null|case|break|rgxcase|replace|pop|pos|character|entryNoCharacter|selection||document||F0|blur|setSelectionRange|createRange|test|moveStart|39|each|createTextRange|number|rgx2|extend|toString|attr|typeof|browser|01|mask|prototype|for|fromCharCode|setTimeout|focus|isIpv4|selectionStart|charCodeAt|select|gi|match|moveEnd|indexOf|ipAddress|selectionEnd|duplicate|100000|jQuery|trim|text|paste|186|webkit|collapse|while|125|keydown|46|keyCode|switch|isIpv6|27|keypress|msie|size|fn|metaKey|maxlength|32|isIpv|altKey|ctrlKey|eval|'.split('|'), 0, {}));