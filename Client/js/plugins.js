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


/*
Copyright 2014 Igor Vaynberg

Version: 3.4.6 Timestamp: Sat Mar 22 22:30:15 EDT 2014

This software is licensed under the Apache License, Version 2.0 (the "Apache License") or the GNU
General Public License version 2 (the "GPL License"). You may choose either license to govern your
use of this software only upon the condition that you accept all of the terms of either the Apache
License or the GPL License.

You may obtain a copy of the Apache License and the GPL License at:

http://www.apache.org/licenses/LICENSE-2.0
http://www.gnu.org/licenses/gpl-2.0.html

Unless required by applicable law or agreed to in writing, software distributed under the Apache License
or the GPL Licesnse is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
either express or implied. See the Apache License and the GPL License for the specific language governing
permissions and limitations under the Apache License and the GPL License.
*/
!function (a) {
    "undefined" == typeof a.fn.each2 && a.extend(a.fn, {
        each2: function (b) {
            for (var c = a([0]), d = -1, e = this.length; ++d < e && (c.context = c[0] = this[d]) && b.call(c[0], d, c) !== !1;) ;
            return this
        }
    })
}(jQuery), function (a, b) {
    "use strict";

    function n(b) {
        var c = a(document.createTextNode(""));
        b.before(c), c.before(b), c.remove()
    }

    function o(a) {
        var b, c, d, e;
        if (!a || a.length < 1) return a;
        for (b = "", c = 0, d = a.length; d > c; c++) e = a.charAt(c), b += m[e] || e;
        return b
    }

    function p(a, b) {
        for (var c = 0, d = b.length; d > c; c += 1) if (r(a, b[c])) return c;
        return -1
    }

    function q() {
        var b = a(l);
        b.appendTo("body");
        var c = {width: b.width() - b[0].clientWidth, height: b.height() - b[0].clientHeight};
        return b.remove(), c
    }

    function r(a, c) {
        return a === c ? !0 : a === b || c === b ? !1 : null === a || null === c ? !1 : a.constructor === String ? a + "" == c + "" : c.constructor === String ? c + "" == a + "" : !1
    }

    function s(b, c) {
        var d, e, f;
        if (null === b || b.length < 1) return [];
        for (d = b.split(c), e = 0, f = d.length; f > e; e += 1) d[e] = a.trim(d[e]);
        return d
    }

    function t(a) {
        return a.outerWidth(!1) - a.width()
    }

    function u(c) {
        var d = "keyup-change-value";
        c.on("keydown", function () {
            a.data(c, d) === b && a.data(c, d, c.val())
        }), c.on("keyup", function () {
            var e = a.data(c, d);
            e !== b && c.val() !== e && (a.removeData(c, d), c.trigger("keyup-change"))
        })
    }

    function v(c) {
        c.on("mousemove", function (c) {
            var d = i;
            (d === b || d.x !== c.pageX || d.y !== c.pageY) && a(c.target).trigger("mousemove-filtered", c)
        })
    }

    function w(a, c, d) {
        d = d || b;
        var e;
        return function () {
            var b = arguments;
            window.clearTimeout(e), e = window.setTimeout(function () {
                c.apply(d, b)
            }, a)
        }
    }

    function x(a) {
        var c, b = !1;
        return function () {
            return b === !1 && (c = a(), b = !0), c
        }
    }

    function y(a, b) {
        var c = w(a, function (a) {
            b.trigger("scroll-debounced", a)
        });
        b.on("scroll", function (a) {
            p(a.target, b.get()) >= 0 && c(a)
        })
    }

    function z(a) {
        a[0] !== document.activeElement && window.setTimeout(function () {
            var d, b = a[0], c = a.val().length;
            a.focus();
            var e = b.offsetWidth > 0 || b.offsetHeight > 0;
            e && b === document.activeElement && (b.setSelectionRange ? b.setSelectionRange(c, c) : b.createTextRange && (d = b.createTextRange(), d.collapse(!1), d.select()))
        }, 0)
    }

    function A(b) {
        b = a(b)[0];
        var c = 0, d = 0;
        if ("selectionStart" in b) c = b.selectionStart, d = b.selectionEnd - c; else if ("selection" in document) {
            b.focus();
            var e = document.selection.createRange();
            d = document.selection.createRange().text.length, e.moveStart("character", -b.value.length), c = e.text.length - d
        }
        return {offset: c, length: d}
    }

    function B(a) {
        a.preventDefault(), a.stopPropagation()
    }

    function C(a) {
        a.preventDefault(), a.stopImmediatePropagation()
    }

    function D(b) {
        if (!h) {
            var c = b[0].currentStyle || window.getComputedStyle(b[0], null);
            h = a(document.createElement("div")).css({
                position: "absolute",
                left: "-10000px",
                top: "-10000px",
                display: "none",
                fontSize: c.fontSize,
                fontFamily: c.fontFamily,
                fontStyle: c.fontStyle,
                fontWeight: c.fontWeight,
                letterSpacing: c.letterSpacing,
                textTransform: c.textTransform,
                whiteSpace: "nowrap"
            }), h.attr("class", "select2-sizer"), a("body").append(h)
        }
        return h.text(b.val()), h.width()
    }

    function E(b, c, d) {
        var e, g, f = [];
        e = b.attr("class"), e && (e = "" + e, a(e.split(" ")).each2(function () {
            0 === this.indexOf("select2-") && f.push(this)
        })), e = c.attr("class"), e && (e = "" + e, a(e.split(" ")).each2(function () {
            0 !== this.indexOf("select2-") && (g = d(this), g && f.push(g))
        })), b.attr("class", f.join(" "))
    }

    function F(a, b, c, d) {
        var e = o(a.toUpperCase()).indexOf(o(b.toUpperCase())), f = b.length;
        return 0 > e ? (c.push(d(a)), void 0) : (c.push(d(a.substring(0, e))), c.push("<span class='select2-match'>"), c.push(d(a.substring(e, e + f))), c.push("</span>"), c.push(d(a.substring(e + f, a.length))), void 0)
    }

    function G(a) {
        var b = {"\\": "&#92;", "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;", "/": "&#47;"};
        return String(a).replace(/[&<>"'\/\\]/g, function (a) {
            return b[a]
        })
    }

    function H(c) {
        var d, e = null, f = c.quietMillis || 100, g = c.url, h = this;
        return function (i) {
            window.clearTimeout(d), d = window.setTimeout(function () {
                var d = c.data, f = g, j = c.transport || a.fn.select2.ajaxDefaults.transport, k = {
                    type: c.type || "GET",
                    cache: c.cache || !1,
                    jsonpCallback: c.jsonpCallback || b,
                    dataType: c.dataType || "json"
                }, l = a.extend({}, a.fn.select2.ajaxDefaults.params, k);
                d = d ? d.call(h, i.term, i.page, i.context) : null, f = "function" == typeof f ? f.call(h, i.term, i.page, i.context) : f, e && "function" == typeof e.abort && e.abort(), c.params && (a.isFunction(c.params) ? a.extend(l, c.params.call(h)) : a.extend(l, c.params)), a.extend(l, {
                    url: f,
                    dataType: c.dataType,
                    data: d,
                    success: function (a) {
                        var b = c.results(a, i.page);
                        i.callback(b)
                    }
                }), e = j.call(h, l)
            }, f)
        }
    }

    function I(b) {
        var d, e, c = b, f = function (a) {
            return "" + a.text
        };
        a.isArray(c) && (e = c, c = {results: e}), a.isFunction(c) === !1 && (e = c, c = function () {
            return e
        });
        var g = c();
        return g.text && (f = g.text, a.isFunction(f) || (d = g.text, f = function (a) {
            return a[d]
        })), function (b) {
            var g, d = b.term, e = {results: []};
            return "" === d ? (b.callback(c()), void 0) : (g = function (c, e) {
                var h, i;
                if (c = c[0], c.children) {
                    h = {};
                    for (i in c) c.hasOwnProperty(i) && (h[i] = c[i]);
                    h.children = [], a(c.children).each2(function (a, b) {
                        g(b, h.children)
                    }), (h.children.length || b.matcher(d, f(h), c)) && e.push(h)
                } else b.matcher(d, f(c), c) && e.push(c)
            }, a(c().results).each2(function (a, b) {
                g(b, e.results)
            }), b.callback(e), void 0)
        }
    }

    function J(c) {
        var d = a.isFunction(c);
        return function (e) {
            var f = e.term, g = {results: []};
            a(d ? c() : c).each(function () {
                var a = this.text !== b, c = a ? this.text : this;
                ("" === f || e.matcher(f, c)) && g.results.push(a ? this : {id: this, text: this})
            }), e.callback(g)
        }
    }

    function K(b, c) {
        if (a.isFunction(b)) return !0;
        if (!b) return !1;
        if ("string" == typeof b) return !0;
        throw new Error(c + " must be a string, function, or falsy value")
    }

    function L(b) {
        if (a.isFunction(b)) {
            var c = Array.prototype.slice.call(arguments, 1);
            return b.apply(null, c)
        }
        return b
    }

    function M(b) {
        var c = 0;
        return a.each(b, function (a, b) {
            b.children ? c += M(b.children) : c++
        }), c
    }

    function N(a, c, d, e) {
        var h, i, j, k, l, f = a, g = !1;
        if (!e.createSearchChoice || !e.tokenSeparators || e.tokenSeparators.length < 1) return b;
        for (; ;) {
            for (i = -1, j = 0, k = e.tokenSeparators.length; k > j && (l = e.tokenSeparators[j], i = a.indexOf(l), !(i >= 0)); j++) ;
            if (0 > i) break;
            if (h = a.substring(0, i), a = a.substring(i + l.length), h.length > 0 && (h = e.createSearchChoice.call(this, h, c), h !== b && null !== h && e.id(h) !== b && null !== e.id(h))) {
                for (g = !1, j = 0, k = c.length; k > j; j++) if (r(e.id(h), e.id(c[j]))) {
                    g = !0;
                    break
                }
                g || d(h)
            }
        }
        return f !== a ? a : void 0
    }

    function O(b, c) {
        var d = function () {
        };
        return d.prototype = new b, d.prototype.constructor = d, d.prototype.parent = b.prototype, d.prototype = a.extend(d.prototype, c), d
    }

    if (window.Select2 === b) {
        var c, d, e, f, g, h, j, k, i = {x: 0, y: 0}, c = {
            TAB: 9,
            ENTER: 13,
            ESC: 27,
            SPACE: 32,
            LEFT: 37,
            UP: 38,
            RIGHT: 39,
            DOWN: 40,
            SHIFT: 16,
            CTRL: 17,
            ALT: 18,
            PAGE_UP: 33,
            PAGE_DOWN: 34,
            HOME: 36,
            END: 35,
            BACKSPACE: 8,
            DELETE: 46,
            isArrow: function (a) {
                switch (a = a.which ? a.which : a) {
                    case c.LEFT:
                    case c.RIGHT:
                    case c.UP:
                    case c.DOWN:
                        return !0
                }
                return !1
            },
            isControl: function (a) {
                var b = a.which;
                switch (b) {
                    case c.SHIFT:
                    case c.CTRL:
                    case c.ALT:
                        return !0
                }
                return a.metaKey ? !0 : !1
            },
            isFunctionKey: function (a) {
                return a = a.which ? a.which : a, a >= 112 && 123 >= a
            }
        }, l = "<div class='select2-measure-scrollbar'></div>", m = {
            "\u24b6": "A",
            "\uff21": "A",
            "\xc0": "A",
            "\xc1": "A",
            "\xc2": "A",
            "\u1ea6": "A",
            "\u1ea4": "A",
            "\u1eaa": "A",
            "\u1ea8": "A",
            "\xc3": "A",
            "\u0100": "A",
            "\u0102": "A",
            "\u1eb0": "A",
            "\u1eae": "A",
            "\u1eb4": "A",
            "\u1eb2": "A",
            "\u0226": "A",
            "\u01e0": "A",
            "\xc4": "A",
            "\u01de": "A",
            "\u1ea2": "A",
            "\xc5": "A",
            "\u01fa": "A",
            "\u01cd": "A",
            "\u0200": "A",
            "\u0202": "A",
            "\u1ea0": "A",
            "\u1eac": "A",
            "\u1eb6": "A",
            "\u1e00": "A",
            "\u0104": "A",
            "\u023a": "A",
            "\u2c6f": "A",
            "\ua732": "AA",
            "\xc6": "AE",
            "\u01fc": "AE",
            "\u01e2": "AE",
            "\ua734": "AO",
            "\ua736": "AU",
            "\ua738": "AV",
            "\ua73a": "AV",
            "\ua73c": "AY",
            "\u24b7": "B",
            "\uff22": "B",
            "\u1e02": "B",
            "\u1e04": "B",
            "\u1e06": "B",
            "\u0243": "B",
            "\u0182": "B",
            "\u0181": "B",
            "\u24b8": "C",
            "\uff23": "C",
            "\u0106": "C",
            "\u0108": "C",
            "\u010a": "C",
            "\u010c": "C",
            "\xc7": "C",
            "\u1e08": "C",
            "\u0187": "C",
            "\u023b": "C",
            "\ua73e": "C",
            "\u24b9": "D",
            "\uff24": "D",
            "\u1e0a": "D",
            "\u010e": "D",
            "\u1e0c": "D",
            "\u1e10": "D",
            "\u1e12": "D",
            "\u1e0e": "D",
            "\u0110": "D",
            "\u018b": "D",
            "\u018a": "D",
            "\u0189": "D",
            "\ua779": "D",
            "\u01f1": "DZ",
            "\u01c4": "DZ",
            "\u01f2": "Dz",
            "\u01c5": "Dz",
            "\u24ba": "E",
            "\uff25": "E",
            "\xc8": "E",
            "\xc9": "E",
            "\xca": "E",
            "\u1ec0": "E",
            "\u1ebe": "E",
            "\u1ec4": "E",
            "\u1ec2": "E",
            "\u1ebc": "E",
            "\u0112": "E",
            "\u1e14": "E",
            "\u1e16": "E",
            "\u0114": "E",
            "\u0116": "E",
            "\xcb": "E",
            "\u1eba": "E",
            "\u011a": "E",
            "\u0204": "E",
            "\u0206": "E",
            "\u1eb8": "E",
            "\u1ec6": "E",
            "\u0228": "E",
            "\u1e1c": "E",
            "\u0118": "E",
            "\u1e18": "E",
            "\u1e1a": "E",
            "\u0190": "E",
            "\u018e": "E",
            "\u24bb": "F",
            "\uff26": "F",
            "\u1e1e": "F",
            "\u0191": "F",
            "\ua77b": "F",
            "\u24bc": "G",
            "\uff27": "G",
            "\u01f4": "G",
            "\u011c": "G",
            "\u1e20": "G",
            "\u011e": "G",
            "\u0120": "G",
            "\u01e6": "G",
            "\u0122": "G",
            "\u01e4": "G",
            "\u0193": "G",
            "\ua7a0": "G",
            "\ua77d": "G",
            "\ua77e": "G",
            "\u24bd": "H",
            "\uff28": "H",
            "\u0124": "H",
            "\u1e22": "H",
            "\u1e26": "H",
            "\u021e": "H",
            "\u1e24": "H",
            "\u1e28": "H",
            "\u1e2a": "H",
            "\u0126": "H",
            "\u2c67": "H",
            "\u2c75": "H",
            "\ua78d": "H",
            "\u24be": "I",
            "\uff29": "I",
            "\xcc": "I",
            "\xcd": "I",
            "\xce": "I",
            "\u0128": "I",
            "\u012a": "I",
            "\u012c": "I",
            "\u0130": "I",
            "\xcf": "I",
            "\u1e2e": "I",
            "\u1ec8": "I",
            "\u01cf": "I",
            "\u0208": "I",
            "\u020a": "I",
            "\u1eca": "I",
            "\u012e": "I",
            "\u1e2c": "I",
            "\u0197": "I",
            "\u24bf": "J",
            "\uff2a": "J",
            "\u0134": "J",
            "\u0248": "J",
            "\u24c0": "K",
            "\uff2b": "K",
            "\u1e30": "K",
            "\u01e8": "K",
            "\u1e32": "K",
            "\u0136": "K",
            "\u1e34": "K",
            "\u0198": "K",
            "\u2c69": "K",
            "\ua740": "K",
            "\ua742": "K",
            "\ua744": "K",
            "\ua7a2": "K",
            "\u24c1": "L",
            "\uff2c": "L",
            "\u013f": "L",
            "\u0139": "L",
            "\u013d": "L",
            "\u1e36": "L",
            "\u1e38": "L",
            "\u013b": "L",
            "\u1e3c": "L",
            "\u1e3a": "L",
            "\u0141": "L",
            "\u023d": "L",
            "\u2c62": "L",
            "\u2c60": "L",
            "\ua748": "L",
            "\ua746": "L",
            "\ua780": "L",
            "\u01c7": "LJ",
            "\u01c8": "Lj",
            "\u24c2": "M",
            "\uff2d": "M",
            "\u1e3e": "M",
            "\u1e40": "M",
            "\u1e42": "M",
            "\u2c6e": "M",
            "\u019c": "M",
            "\u24c3": "N",
            "\uff2e": "N",
            "\u01f8": "N",
            "\u0143": "N",
            "\xd1": "N",
            "\u1e44": "N",
            "\u0147": "N",
            "\u1e46": "N",
            "\u0145": "N",
            "\u1e4a": "N",
            "\u1e48": "N",
            "\u0220": "N",
            "\u019d": "N",
            "\ua790": "N",
            "\ua7a4": "N",
            "\u01ca": "NJ",
            "\u01cb": "Nj",
            "\u24c4": "O",
            "\uff2f": "O",
            "\xd2": "O",
            "\xd3": "O",
            "\xd4": "O",
            "\u1ed2": "O",
            "\u1ed0": "O",
            "\u1ed6": "O",
            "\u1ed4": "O",
            "\xd5": "O",
            "\u1e4c": "O",
            "\u022c": "O",
            "\u1e4e": "O",
            "\u014c": "O",
            "\u1e50": "O",
            "\u1e52": "O",
            "\u014e": "O",
            "\u022e": "O",
            "\u0230": "O",
            "\xd6": "O",
            "\u022a": "O",
            "\u1ece": "O",
            "\u0150": "O",
            "\u01d1": "O",
            "\u020c": "O",
            "\u020e": "O",
            "\u01a0": "O",
            "\u1edc": "O",
            "\u1eda": "O",
            "\u1ee0": "O",
            "\u1ede": "O",
            "\u1ee2": "O",
            "\u1ecc": "O",
            "\u1ed8": "O",
            "\u01ea": "O",
            "\u01ec": "O",
            "\xd8": "O",
            "\u01fe": "O",
            "\u0186": "O",
            "\u019f": "O",
            "\ua74a": "O",
            "\ua74c": "O",
            "\u01a2": "OI",
            "\ua74e": "OO",
            "\u0222": "OU",
            "\u24c5": "P",
            "\uff30": "P",
            "\u1e54": "P",
            "\u1e56": "P",
            "\u01a4": "P",
            "\u2c63": "P",
            "\ua750": "P",
            "\ua752": "P",
            "\ua754": "P",
            "\u24c6": "Q",
            "\uff31": "Q",
            "\ua756": "Q",
            "\ua758": "Q",
            "\u024a": "Q",
            "\u24c7": "R",
            "\uff32": "R",
            "\u0154": "R",
            "\u1e58": "R",
            "\u0158": "R",
            "\u0210": "R",
            "\u0212": "R",
            "\u1e5a": "R",
            "\u1e5c": "R",
            "\u0156": "R",
            "\u1e5e": "R",
            "\u024c": "R",
            "\u2c64": "R",
            "\ua75a": "R",
            "\ua7a6": "R",
            "\ua782": "R",
            "\u24c8": "S",
            "\uff33": "S",
            "\u1e9e": "S",
            "\u015a": "S",
            "\u1e64": "S",
            "\u015c": "S",
            "\u1e60": "S",
            "\u0160": "S",
            "\u1e66": "S",
            "\u1e62": "S",
            "\u1e68": "S",
            "\u0218": "S",
            "\u015e": "S",
            "\u2c7e": "S",
            "\ua7a8": "S",
            "\ua784": "S",
            "\u24c9": "T",
            "\uff34": "T",
            "\u1e6a": "T",
            "\u0164": "T",
            "\u1e6c": "T",
            "\u021a": "T",
            "\u0162": "T",
            "\u1e70": "T",
            "\u1e6e": "T",
            "\u0166": "T",
            "\u01ac": "T",
            "\u01ae": "T",
            "\u023e": "T",
            "\ua786": "T",
            "\ua728": "TZ",
            "\u24ca": "U",
            "\uff35": "U",
            "\xd9": "U",
            "\xda": "U",
            "\xdb": "U",
            "\u0168": "U",
            "\u1e78": "U",
            "\u016a": "U",
            "\u1e7a": "U",
            "\u016c": "U",
            "\xdc": "U",
            "\u01db": "U",
            "\u01d7": "U",
            "\u01d5": "U",
            "\u01d9": "U",
            "\u1ee6": "U",
            "\u016e": "U",
            "\u0170": "U",
            "\u01d3": "U",
            "\u0214": "U",
            "\u0216": "U",
            "\u01af": "U",
            "\u1eea": "U",
            "\u1ee8": "U",
            "\u1eee": "U",
            "\u1eec": "U",
            "\u1ef0": "U",
            "\u1ee4": "U",
            "\u1e72": "U",
            "\u0172": "U",
            "\u1e76": "U",
            "\u1e74": "U",
            "\u0244": "U",
            "\u24cb": "V",
            "\uff36": "V",
            "\u1e7c": "V",
            "\u1e7e": "V",
            "\u01b2": "V",
            "\ua75e": "V",
            "\u0245": "V",
            "\ua760": "VY",
            "\u24cc": "W",
            "\uff37": "W",
            "\u1e80": "W",
            "\u1e82": "W",
            "\u0174": "W",
            "\u1e86": "W",
            "\u1e84": "W",
            "\u1e88": "W",
            "\u2c72": "W",
            "\u24cd": "X",
            "\uff38": "X",
            "\u1e8a": "X",
            "\u1e8c": "X",
            "\u24ce": "Y",
            "\uff39": "Y",
            "\u1ef2": "Y",
            "\xdd": "Y",
            "\u0176": "Y",
            "\u1ef8": "Y",
            "\u0232": "Y",
            "\u1e8e": "Y",
            "\u0178": "Y",
            "\u1ef6": "Y",
            "\u1ef4": "Y",
            "\u01b3": "Y",
            "\u024e": "Y",
            "\u1efe": "Y",
            "\u24cf": "Z",
            "\uff3a": "Z",
            "\u0179": "Z",
            "\u1e90": "Z",
            "\u017b": "Z",
            "\u017d": "Z",
            "\u1e92": "Z",
            "\u1e94": "Z",
            "\u01b5": "Z",
            "\u0224": "Z",
            "\u2c7f": "Z",
            "\u2c6b": "Z",
            "\ua762": "Z",
            "\u24d0": "a",
            "\uff41": "a",
            "\u1e9a": "a",
            "\xe0": "a",
            "\xe1": "a",
            "\xe2": "a",
            "\u1ea7": "a",
            "\u1ea5": "a",
            "\u1eab": "a",
            "\u1ea9": "a",
            "\xe3": "a",
            "\u0101": "a",
            "\u0103": "a",
            "\u1eb1": "a",
            "\u1eaf": "a",
            "\u1eb5": "a",
            "\u1eb3": "a",
            "\u0227": "a",
            "\u01e1": "a",
            "\xe4": "a",
            "\u01df": "a",
            "\u1ea3": "a",
            "\xe5": "a",
            "\u01fb": "a",
            "\u01ce": "a",
            "\u0201": "a",
            "\u0203": "a",
            "\u1ea1": "a",
            "\u1ead": "a",
            "\u1eb7": "a",
            "\u1e01": "a",
            "\u0105": "a",
            "\u2c65": "a",
            "\u0250": "a",
            "\ua733": "aa",
            "\xe6": "ae",
            "\u01fd": "ae",
            "\u01e3": "ae",
            "\ua735": "ao",
            "\ua737": "au",
            "\ua739": "av",
            "\ua73b": "av",
            "\ua73d": "ay",
            "\u24d1": "b",
            "\uff42": "b",
            "\u1e03": "b",
            "\u1e05": "b",
            "\u1e07": "b",
            "\u0180": "b",
            "\u0183": "b",
            "\u0253": "b",
            "\u24d2": "c",
            "\uff43": "c",
            "\u0107": "c",
            "\u0109": "c",
            "\u010b": "c",
            "\u010d": "c",
            "\xe7": "c",
            "\u1e09": "c",
            "\u0188": "c",
            "\u023c": "c",
            "\ua73f": "c",
            "\u2184": "c",
            "\u24d3": "d",
            "\uff44": "d",
            "\u1e0b": "d",
            "\u010f": "d",
            "\u1e0d": "d",
            "\u1e11": "d",
            "\u1e13": "d",
            "\u1e0f": "d",
            "\u0111": "d",
            "\u018c": "d",
            "\u0256": "d",
            "\u0257": "d",
            "\ua77a": "d",
            "\u01f3": "dz",
            "\u01c6": "dz",
            "\u24d4": "e",
            "\uff45": "e",
            "\xe8": "e",
            "\xe9": "e",
            "\xea": "e",
            "\u1ec1": "e",
            "\u1ebf": "e",
            "\u1ec5": "e",
            "\u1ec3": "e",
            "\u1ebd": "e",
            "\u0113": "e",
            "\u1e15": "e",
            "\u1e17": "e",
            "\u0115": "e",
            "\u0117": "e",
            "\xeb": "e",
            "\u1ebb": "e",
            "\u011b": "e",
            "\u0205": "e",
            "\u0207": "e",
            "\u1eb9": "e",
            "\u1ec7": "e",
            "\u0229": "e",
            "\u1e1d": "e",
            "\u0119": "e",
            "\u1e19": "e",
            "\u1e1b": "e",
            "\u0247": "e",
            "\u025b": "e",
            "\u01dd": "e",
            "\u24d5": "f",
            "\uff46": "f",
            "\u1e1f": "f",
            "\u0192": "f",
            "\ua77c": "f",
            "\u24d6": "g",
            "\uff47": "g",
            "\u01f5": "g",
            "\u011d": "g",
            "\u1e21": "g",
            "\u011f": "g",
            "\u0121": "g",
            "\u01e7": "g",
            "\u0123": "g",
            "\u01e5": "g",
            "\u0260": "g",
            "\ua7a1": "g",
            "\u1d79": "g",
            "\ua77f": "g",
            "\u24d7": "h",
            "\uff48": "h",
            "\u0125": "h",
            "\u1e23": "h",
            "\u1e27": "h",
            "\u021f": "h",
            "\u1e25": "h",
            "\u1e29": "h",
            "\u1e2b": "h",
            "\u1e96": "h",
            "\u0127": "h",
            "\u2c68": "h",
            "\u2c76": "h",
            "\u0265": "h",
            "\u0195": "hv",
            "\u24d8": "i",
            "\uff49": "i",
            "\xec": "i",
            "\xed": "i",
            "\xee": "i",
            "\u0129": "i",
            "\u012b": "i",
            "\u012d": "i",
            "\xef": "i",
            "\u1e2f": "i",
            "\u1ec9": "i",
            "\u01d0": "i",
            "\u0209": "i",
            "\u020b": "i",
            "\u1ecb": "i",
            "\u012f": "i",
            "\u1e2d": "i",
            "\u0268": "i",
            "\u0131": "i",
            "\u24d9": "j",
            "\uff4a": "j",
            "\u0135": "j",
            "\u01f0": "j",
            "\u0249": "j",
            "\u24da": "k",
            "\uff4b": "k",
            "\u1e31": "k",
            "\u01e9": "k",
            "\u1e33": "k",
            "\u0137": "k",
            "\u1e35": "k",
            "\u0199": "k",
            "\u2c6a": "k",
            "\ua741": "k",
            "\ua743": "k",
            "\ua745": "k",
            "\ua7a3": "k",
            "\u24db": "l",
            "\uff4c": "l",
            "\u0140": "l",
            "\u013a": "l",
            "\u013e": "l",
            "\u1e37": "l",
            "\u1e39": "l",
            "\u013c": "l",
            "\u1e3d": "l",
            "\u1e3b": "l",
            "\u017f": "l",
            "\u0142": "l",
            "\u019a": "l",
            "\u026b": "l",
            "\u2c61": "l",
            "\ua749": "l",
            "\ua781": "l",
            "\ua747": "l",
            "\u01c9": "lj",
            "\u24dc": "m",
            "\uff4d": "m",
            "\u1e3f": "m",
            "\u1e41": "m",
            "\u1e43": "m",
            "\u0271": "m",
            "\u026f": "m",
            "\u24dd": "n",
            "\uff4e": "n",
            "\u01f9": "n",
            "\u0144": "n",
            "\xf1": "n",
            "\u1e45": "n",
            "\u0148": "n",
            "\u1e47": "n",
            "\u0146": "n",
            "\u1e4b": "n",
            "\u1e49": "n",
            "\u019e": "n",
            "\u0272": "n",
            "\u0149": "n",
            "\ua791": "n",
            "\ua7a5": "n",
            "\u01cc": "nj",
            "\u24de": "o",
            "\uff4f": "o",
            "\xf2": "o",
            "\xf3": "o",
            "\xf4": "o",
            "\u1ed3": "o",
            "\u1ed1": "o",
            "\u1ed7": "o",
            "\u1ed5": "o",
            "\xf5": "o",
            "\u1e4d": "o",
            "\u022d": "o",
            "\u1e4f": "o",
            "\u014d": "o",
            "\u1e51": "o",
            "\u1e53": "o",
            "\u014f": "o",
            "\u022f": "o",
            "\u0231": "o",
            "\xf6": "o",
            "\u022b": "o",
            "\u1ecf": "o",
            "\u0151": "o",
            "\u01d2": "o",
            "\u020d": "o",
            "\u020f": "o",
            "\u01a1": "o",
            "\u1edd": "o",
            "\u1edb": "o",
            "\u1ee1": "o",
            "\u1edf": "o",
            "\u1ee3": "o",
            "\u1ecd": "o",
            "\u1ed9": "o",
            "\u01eb": "o",
            "\u01ed": "o",
            "\xf8": "o",
            "\u01ff": "o",
            "\u0254": "o",
            "\ua74b": "o",
            "\ua74d": "o",
            "\u0275": "o",
            "\u01a3": "oi",
            "\u0223": "ou",
            "\ua74f": "oo",
            "\u24df": "p",
            "\uff50": "p",
            "\u1e55": "p",
            "\u1e57": "p",
            "\u01a5": "p",
            "\u1d7d": "p",
            "\ua751": "p",
            "\ua753": "p",
            "\ua755": "p",
            "\u24e0": "q",
            "\uff51": "q",
            "\u024b": "q",
            "\ua757": "q",
            "\ua759": "q",
            "\u24e1": "r",
            "\uff52": "r",
            "\u0155": "r",
            "\u1e59": "r",
            "\u0159": "r",
            "\u0211": "r",
            "\u0213": "r",
            "\u1e5b": "r",
            "\u1e5d": "r",
            "\u0157": "r",
            "\u1e5f": "r",
            "\u024d": "r",
            "\u027d": "r",
            "\ua75b": "r",
            "\ua7a7": "r",
            "\ua783": "r",
            "\u24e2": "s",
            "\uff53": "s",
            "\xdf": "s",
            "\u015b": "s",
            "\u1e65": "s",
            "\u015d": "s",
            "\u1e61": "s",
            "\u0161": "s",
            "\u1e67": "s",
            "\u1e63": "s",
            "\u1e69": "s",
            "\u0219": "s",
            "\u015f": "s",
            "\u023f": "s",
            "\ua7a9": "s",
            "\ua785": "s",
            "\u1e9b": "s",
            "\u24e3": "t",
            "\uff54": "t",
            "\u1e6b": "t",
            "\u1e97": "t",
            "\u0165": "t",
            "\u1e6d": "t",
            "\u021b": "t",
            "\u0163": "t",
            "\u1e71": "t",
            "\u1e6f": "t",
            "\u0167": "t",
            "\u01ad": "t",
            "\u0288": "t",
            "\u2c66": "t",
            "\ua787": "t",
            "\ua729": "tz",
            "\u24e4": "u",
            "\uff55": "u",
            "\xf9": "u",
            "\xfa": "u",
            "\xfb": "u",
            "\u0169": "u",
            "\u1e79": "u",
            "\u016b": "u",
            "\u1e7b": "u",
            "\u016d": "u",
            "\xfc": "u",
            "\u01dc": "u",
            "\u01d8": "u",
            "\u01d6": "u",
            "\u01da": "u",
            "\u1ee7": "u",
            "\u016f": "u",
            "\u0171": "u",
            "\u01d4": "u",
            "\u0215": "u",
            "\u0217": "u",
            "\u01b0": "u",
            "\u1eeb": "u",
            "\u1ee9": "u",
            "\u1eef": "u",
            "\u1eed": "u",
            "\u1ef1": "u",
            "\u1ee5": "u",
            "\u1e73": "u",
            "\u0173": "u",
            "\u1e77": "u",
            "\u1e75": "u",
            "\u0289": "u",
            "\u24e5": "v",
            "\uff56": "v",
            "\u1e7d": "v",
            "\u1e7f": "v",
            "\u028b": "v",
            "\ua75f": "v",
            "\u028c": "v",
            "\ua761": "vy",
            "\u24e6": "w",
            "\uff57": "w",
            "\u1e81": "w",
            "\u1e83": "w",
            "\u0175": "w",
            "\u1e87": "w",
            "\u1e85": "w",
            "\u1e98": "w",
            "\u1e89": "w",
            "\u2c73": "w",
            "\u24e7": "x",
            "\uff58": "x",
            "\u1e8b": "x",
            "\u1e8d": "x",
            "\u24e8": "y",
            "\uff59": "y",
            "\u1ef3": "y",
            "\xfd": "y",
            "\u0177": "y",
            "\u1ef9": "y",
            "\u0233": "y",
            "\u1e8f": "y",
            "\xff": "y",
            "\u1ef7": "y",
            "\u1e99": "y",
            "\u1ef5": "y",
            "\u01b4": "y",
            "\u024f": "y",
            "\u1eff": "y",
            "\u24e9": "z",
            "\uff5a": "z",
            "\u017a": "z",
            "\u1e91": "z",
            "\u017c": "z",
            "\u017e": "z",
            "\u1e93": "z",
            "\u1e95": "z",
            "\u01b6": "z",
            "\u0225": "z",
            "\u0240": "z",
            "\u2c6c": "z",
            "\ua763": "z"
        };
        j = a(document), g = function () {
            var a = 1;
            return function () {
                return a++
            }
        }(), j.on("mousemove", function (a) {
            i.x = a.pageX, i.y = a.pageY
        }), d = O(Object, {
            bind: function (a) {
                var b = this;
                return function () {
                    a.apply(b, arguments)
                }
            }, init: function (c) {
                var d, e, f = ".select2-results";
                this.opts = c = this.prepareOpts(c), this.id = c.id, c.element.data("select2") !== b && null !== c.element.data("select2") && c.element.data("select2").destroy(), this.container = this.createContainer(), this.liveRegion = a("<span>", {
                    role: "status",
                    "aria-live": "polite"
                }).addClass("select2-hidden-accessible").appendTo(document.body), this.containerId = "s2id_" + (c.element.attr("id") || "autogen" + g()).replace(/([;&,\-\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, "\\$1"), this.containerSelector = "#" + this.containerId, this.container.attr("id", this.containerId), this.body = x(function () {
                    return c.element.closest("body")
                }), E(this.container, this.opts.element, this.opts.adaptContainerCssClass), this.container.attr("style", c.element.attr("style")), this.container.css(L(c.containerCss)), this.container.addClass(L(c.containerCssClass)), this.elementTabIndex = this.opts.element.attr("tabindex"), this.opts.element.data("select2", this).attr("tabindex", "-1").before(this.container).on("click.select2", B), this.container.data("select2", this), this.dropdown = this.container.find(".select2-drop"), E(this.dropdown, this.opts.element, this.opts.adaptDropdownCssClass), this.dropdown.addClass(L(c.dropdownCssClass)), this.dropdown.data("select2", this), this.dropdown.on("click", B), this.results = d = this.container.find(f), this.search = e = this.container.find("input.select2-input"), this.queryCount = 0, this.resultsPage = 0, this.context = null, this.initContainer(), this.container.on("click", B), v(this.results), this.dropdown.on("mousemove-filtered touchstart touchmove touchend", f, this.bind(this.highlightUnderEvent)), this.dropdown.on("touchend", f, this.bind(this.selectHighlighted)), this.dropdown.on("touchmove", f, this.bind(this.touchMoved)), this.dropdown.on("touchstart touchend", f, this.bind(this.clearTouchMoved)), y(80, this.results), this.dropdown.on("scroll-debounced", f, this.bind(this.loadMoreIfNeeded)), a(this.container).on("change", ".select2-input", function (a) {
                    a.stopPropagation()
                }), a(this.dropdown).on("change", ".select2-input", function (a) {
                    a.stopPropagation()
                }), a.fn.mousewheel && d.mousewheel(function (a, b, c, e) {
                    var f = d.scrollTop();
                    e > 0 && 0 >= f - e ? (d.scrollTop(0), B(a)) : 0 > e && d.get(0).scrollHeight - d.scrollTop() + e <= d.height() && (d.scrollTop(d.get(0).scrollHeight - d.height()), B(a))
                }), u(e), e.on("keyup-change input paste", this.bind(this.updateResults)), e.on("focus", function () {
                    e.addClass("select2-focused")
                }), e.on("blur", function () {
                    e.removeClass("select2-focused")
                }), this.dropdown.on("mouseup", f, this.bind(function (b) {
                    a(b.target).closest(".select2-result-selectable").length > 0 && (this.highlightUnderEvent(b), this.selectHighlighted(b))
                })), this.dropdown.on("click mouseup mousedown focusin", function (a) {
                    a.stopPropagation()
                }), this.nextSearchTerm = b, a.isFunction(this.opts.initSelection) && (this.initSelection(), this.monitorSource()), null !== c.maximumInputLength && this.search.attr("maxlength", c.maximumInputLength);
                var h = c.element.prop("disabled");
                h === b && (h = !1), this.enable(!h);
                var i = c.element.prop("readonly");
                i === b && (i = !1), this.readonly(i), k = k || q(), this.autofocus = c.element.prop("autofocus"), c.element.prop("autofocus", !1), this.autofocus && this.focus(), this.search.attr("placeholder", c.searchInputPlaceholder)
            }, destroy: function () {
                var a = this.opts.element, c = a.data("select2");
                this.close(), this.propertyObserver && (delete this.propertyObserver, this.propertyObserver = null), c !== b && (c.container.remove(), c.liveRegion.remove(), c.dropdown.remove(), a.removeClass("select2-offscreen").removeData("select2").off(".select2").prop("autofocus", this.autofocus || !1), this.elementTabIndex ? a.attr({tabindex: this.elementTabIndex}) : a.removeAttr("tabindex"), a.show())
            }, optionToData: function (a) {
                return a.is("option") ? {
                    id: a.prop("value"),
                    text: a.text(),
                    element: a.get(),
                    css: a.attr("class"),
                    disabled: a.prop("disabled"),
                    locked: r(a.attr("locked"), "locked") || r(a.data("locked"), !0)
                } : a.is("optgroup") ? {
                    text: a.attr("label"),
                    children: [],
                    element: a.get(),
                    css: a.attr("class")
                } : void 0
            }, prepareOpts: function (c) {
                var d, e, f, h, i = this;
                if (d = c.element, "select" === d.get(0).tagName.toLowerCase() && (this.select = e = c.element), e && a.each(["id", "multiple", "ajax", "query", "createSearchChoice", "initSelection", "data", "tags"], function () {
                    if (this in c) throw new Error("Option '" + this + "' is not allowed for Select2 when attached to a <select> element.")
                }), c = a.extend({}, {
                    populateResults: function (d, e, f) {
                        var h, j = this.opts.id, k = this.liveRegion;
                        h = function (d, e, l) {
                            var m, n, o, p, q, r, s, t, u, v;
                            for (d = c.sortResults(d, e, f), m = 0, n = d.length; n > m; m += 1) o = d[m], q = o.disabled === !0, p = !q && j(o) !== b, r = o.children && o.children.length > 0, s = a("<li></li>"), s.addClass("select2-results-dept-" + l), s.addClass("select2-result"), s.addClass(p ? "select2-result-selectable" : "select2-result-unselectable"), q && s.addClass("select2-disabled"), r && s.addClass("select2-result-with-children"), s.addClass(i.opts.formatResultCssClass(o)), s.attr("role", "presentation"), t = a(document.createElement("div")), t.addClass("select2-result-label"), t.attr("id", "select2-result-label-" + g()), t.attr("role", "option"), v = c.formatResult(o, t, f, i.opts.escapeMarkup), v !== b && (t.html(v), s.append(t)), r && (u = a("<ul></ul>"), u.addClass("select2-result-sub"), h(o.children, u, l + 1), s.append(u)), s.data("select2-data", o), e.append(s);
                            k.text(c.formatMatches(d.length))
                        }, h(e, d, 0)
                    }
                }, a.fn.select2.defaults, c), "function" != typeof c.id && (f = c.id, c.id = function (a) {
                    return a[f]
                }), a.isArray(c.element.data("select2Tags"))) {
                    if ("tags" in c) throw"tags specified as both an attribute 'data-select2-tags' and in options of Select2 " + c.element.attr("id");
                    c.tags = c.element.data("select2Tags")
                }
                if (e ? (c.query = this.bind(function (a) {
                    var f, g, h, c = {results: [], more: !1}, e = a.term;
                    h = function (b, c) {
                        var d;
                        b.is("option") ? a.matcher(e, b.text(), b) && c.push(i.optionToData(b)) : b.is("optgroup") && (d = i.optionToData(b), b.children().each2(function (a, b) {
                            h(b, d.children)
                        }), d.children.length > 0 && c.push(d))
                    }, f = d.children(), this.getPlaceholder() !== b && f.length > 0 && (g = this.getPlaceholderOption(), g && (f = f.not(g))), f.each2(function (a, b) {
                        h(b, c.results)
                    }), a.callback(c)
                }), c.id = function (a) {
                    return a.id
                }) : "query" in c || ("ajax" in c ? (h = c.element.data("ajax-url"), h && h.length > 0 && (c.ajax.url = h), c.query = H.call(c.element, c.ajax)) : "data" in c ? c.query = I(c.data) : "tags" in c && (c.query = J(c.tags), c.createSearchChoice === b && (c.createSearchChoice = function (b) {
                    return {id: a.trim(b), text: a.trim(b)}
                }), c.initSelection === b && (c.initSelection = function (b, d) {
                    var e = [];
                    a(s(b.val(), c.separator)).each(function () {
                        var b = {id: this, text: this}, d = c.tags;
                        a.isFunction(d) && (d = d()), a(d).each(function () {
                            return r(this.id, b.id) ? (b = this, !1) : void 0
                        }), e.push(b)
                    }), d(e)
                }))), "function" != typeof c.query) throw"query function not defined for Select2 " + c.element.attr("id");
                if ("top" === c.createSearchChoicePosition) c.createSearchChoicePosition = function (a, b) {
                    a.unshift(b)
                }; else if ("bottom" === c.createSearchChoicePosition) c.createSearchChoicePosition = function (a, b) {
                    a.push(b)
                }; else if ("function" != typeof c.createSearchChoicePosition) throw"invalid createSearchChoicePosition option must be 'top', 'bottom' or a custom function";
                return c
            }, monitorSource: function () {
                var c, d, a = this.opts.element;
                a.on("change.select2", this.bind(function () {
                    this.opts.element.data("select2-change-triggered") !== !0 && this.initSelection()
                })), c = this.bind(function () {
                    var c = a.prop("disabled");
                    c === b && (c = !1), this.enable(!c);
                    var d = a.prop("readonly");
                    d === b && (d = !1), this.readonly(d), E(this.container, this.opts.element, this.opts.adaptContainerCssClass), this.container.addClass(L(this.opts.containerCssClass)), E(this.dropdown, this.opts.element, this.opts.adaptDropdownCssClass), this.dropdown.addClass(L(this.opts.dropdownCssClass))
                }), a.on("propertychange.select2", c), this.mutationCallback === b && (this.mutationCallback = function (a) {
                    a.forEach(c)
                }), d = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver, d !== b && (this.propertyObserver && (delete this.propertyObserver, this.propertyObserver = null), this.propertyObserver = new d(this.mutationCallback), this.propertyObserver.observe(a.get(0), {
                    attributes: !0,
                    subtree: !1
                }))
            }, triggerSelect: function (b) {
                var c = a.Event("select2-selecting", {val: this.id(b), object: b});
                return this.opts.element.trigger(c), !c.isDefaultPrevented()
            }, triggerChange: function (b) {
                b = b || {}, b = a.extend({}, b, {
                    type: "change",
                    val: this.val()
                }), this.opts.element.data("select2-change-triggered", !0), this.opts.element.trigger(b), this.opts.element.data("select2-change-triggered", !1), this.opts.element.click(), this.opts.blurOnChange && this.opts.element.blur()
            }, isInterfaceEnabled: function () {
                return this.enabledInterface === !0
            }, enableInterface: function () {
                var a = this._enabled && !this._readonly, b = !a;
                return a === this.enabledInterface ? !1 : (this.container.toggleClass("select2-container-disabled", b), this.close(), this.enabledInterface = a, !0)
            }, enable: function (a) {
                a === b && (a = !0), this._enabled !== a && (this._enabled = a, this.opts.element.prop("disabled", !a), this.enableInterface())
            }, disable: function () {
                this.enable(!1)
            }, readonly: function (a) {
                a === b && (a = !1), this._readonly !== a && (this._readonly = a, this.opts.element.prop("readonly", a), this.enableInterface())
            }, opened: function () {
                return this.container.hasClass("select2-dropdown-open")
            }, positionDropdown: function () {
                var t, u, v, w, x, b = this.dropdown, c = this.container.offset(), d = this.container.outerHeight(!1),
                    e = this.container.outerWidth(!1), f = b.outerHeight(!1), g = a(window), h = g.width(),
                    i = g.height(), j = g.scrollLeft() + h, l = g.scrollTop() + i, m = c.top + d, n = c.left,
                    o = l >= m + f, p = c.top - f >= g.scrollTop(), q = b.outerWidth(!1), r = j >= n + q,
                    s = b.hasClass("select2-drop-above");
                s ? (u = !0, !p && o && (v = !0, u = !1)) : (u = !1, !o && p && (v = !0, u = !0)), v && (b.hide(), c = this.container.offset(), d = this.container.outerHeight(!1), e = this.container.outerWidth(!1), f = b.outerHeight(!1), j = g.scrollLeft() + h, l = g.scrollTop() + i, m = c.top + d, n = c.left, q = b.outerWidth(!1), r = j >= n + q, b.show()), this.opts.dropdownAutoWidth ? (x = a(".select2-results", b)[0], b.addClass("select2-drop-auto-width"), b.css("width", ""), q = b.outerWidth(!1) + (x.scrollHeight === x.clientHeight ? 0 : k.width), q > e ? e = q : q = e, r = j >= n + q) : this.container.removeClass("select2-drop-auto-width"), "static" !== this.body().css("position") && (t = this.body().offset(), m -= t.top, n -= t.left), r || (n = c.left + this.container.outerWidth(!1) - q), w = {
                    left: n,
                    width: e
                }, u ? (w.top = c.top - f, w.bottom = "auto", this.container.addClass("select2-drop-above"), b.addClass("select2-drop-above")) : (w.top = m, w.bottom = "auto", this.container.removeClass("select2-drop-above"), b.removeClass("select2-drop-above")), w = a.extend(w, L(this.opts.dropdownCss)), b.css(w)
            }, shouldOpen: function () {
                var b;
                return this.opened() ? !1 : this._enabled === !1 || this._readonly === !0 ? !1 : (b = a.Event("select2-opening"), this.opts.element.trigger(b), !b.isDefaultPrevented())
            }, clearDropdownAlignmentPreference: function () {
                this.container.removeClass("select2-drop-above"), this.dropdown.removeClass("select2-drop-above")
            }, open: function () {
                return this.shouldOpen() ? (this.opening(), !0) : !1
            }, opening: function () {
                var f, b = this.containerId, c = "scroll." + b, d = "resize." + b, e = "orientationchange." + b;
                this.container.addClass("select2-dropdown-open").addClass("select2-container-active"), this.clearDropdownAlignmentPreference(), this.dropdown[0] !== this.body().children().last()[0] && this.dropdown.detach().appendTo(this.body()), f = a("#select2-drop-mask"), 0 == f.length && (f = a(document.createElement("div")), f.attr("id", "select2-drop-mask").attr("class", "select2-drop-mask"), f.hide(), f.appendTo(this.body()), f.on("mousedown touchstart click", function (b) {
                    n(f);
                    var d, c = a("#select2-drop");
                    c.length > 0 && (d = c.data("select2"), d.opts.selectOnBlur && d.selectHighlighted({noFocus: !0}), d.close(), b.preventDefault(), b.stopPropagation())
                })), this.dropdown.prev()[0] !== f[0] && this.dropdown.before(f), a("#select2-drop").removeAttr("id"), this.dropdown.attr("id", "select2-drop"), f.show(), this.positionDropdown(), this.dropdown.show(), this.positionDropdown(), this.dropdown.addClass("select2-drop-active");
                var g = this;
                this.container.parents().add(window).each(function () {
                    a(this).on(d + " " + c + " " + e, function () {
                        g.positionDropdown()
                    })
                })
            }, close: function () {
                if (this.opened()) {
                    var b = this.containerId, c = "scroll." + b, d = "resize." + b, e = "orientationchange." + b;
                    this.container.parents().add(window).each(function () {
                        a(this).off(c).off(d).off(e)
                    }), this.clearDropdownAlignmentPreference(), a("#select2-drop-mask").hide(), this.dropdown.removeAttr("id"), this.dropdown.hide(), this.container.removeClass("select2-dropdown-open").removeClass("select2-container-active"), this.results.empty(), this.clearSearch(), this.search.removeClass("select2-active"), this.opts.element.trigger(a.Event("select2-close"))
                }
            }, externalSearch: function (a) {
                this.open(), this.search.val(a), this.updateResults(!1)
            }, clearSearch: function () {
            }, getMaximumSelectionSize: function () {
                return L(this.opts.maximumSelectionSize)
            }, ensureHighlightVisible: function () {
                var c, d, e, f, g, h, i, b = this.results;
                if (d = this.highlight(), !(0 > d)) {
                    if (0 == d) return b.scrollTop(0), void 0;
                    c = this.findHighlightableChoices().find(".select2-result-label"), e = a(c[d]), f = e.offset().top + e.outerHeight(!0), d === c.length - 1 && (i = b.find("li.select2-more-results"), i.length > 0 && (f = i.offset().top + i.outerHeight(!0))), g = b.offset().top + b.outerHeight(!0), f > g && b.scrollTop(b.scrollTop() + (f - g)), h = e.offset().top - b.offset().top, 0 > h && "none" != e.css("display") && b.scrollTop(b.scrollTop() + h)
                }
            }, findHighlightableChoices: function () {
                return this.results.find(".select2-result-selectable:not(.select2-disabled):not(.select2-selected)")
            }, moveHighlight: function (b) {
                for (var c = this.findHighlightableChoices(), d = this.highlight(); d > -1 && d < c.length;) {
                    d += b;
                    var e = a(c[d]);
                    if (e.hasClass("select2-result-selectable") && !e.hasClass("select2-disabled") && !e.hasClass("select2-selected")) {
                        this.highlight(d);
                        break
                    }
                }
            }, highlight: function (b) {
                var d, e, c = this.findHighlightableChoices();
                return 0 === arguments.length ? p(c.filter(".select2-highlighted")[0], c.get()) : (b >= c.length && (b = c.length - 1), 0 > b && (b = 0), this.removeHighlight(), d = a(c[b]), d.addClass("select2-highlighted"), this.search.attr("aria-activedescendant", d.find(".select2-result-label").attr("id")), this.ensureHighlightVisible(), this.liveRegion.text(d.text()), e = d.data("select2-data"), e && this.opts.element.trigger({
                    type: "select2-highlight",
                    val: this.id(e),
                    choice: e
                }), void 0)
            }, removeHighlight: function () {
                this.results.find(".select2-highlighted").removeClass("select2-highlighted")
            }, touchMoved: function () {
                this._touchMoved = !0
            }, clearTouchMoved: function () {
                this._touchMoved = !1
            }, countSelectableResults: function () {
                return this.findHighlightableChoices().length
            }, highlightUnderEvent: function (b) {
                var c = a(b.target).closest(".select2-result-selectable");
                if (c.length > 0 && !c.is(".select2-highlighted")) {
                    var d = this.findHighlightableChoices();
                    this.highlight(d.index(c))
                } else 0 == c.length && this.removeHighlight()
            }, loadMoreIfNeeded: function () {
                var c, a = this.results, b = a.find("li.select2-more-results"), d = this.resultsPage + 1, e = this,
                    f = this.search.val(), g = this.context;
                0 !== b.length && (c = b.offset().top - a.offset().top - a.height(), c <= this.opts.loadMorePadding && (b.addClass("select2-active"), this.opts.query({
                    element: this.opts.element,
                    term: f,
                    page: d,
                    context: g,
                    matcher: this.opts.matcher,
                    callback: this.bind(function (c) {
                        e.opened() && (e.opts.populateResults.call(this, a, c.results, {
                            term: f,
                            page: d,
                            context: g
                        }), e.postprocessResults(c, !1, !1), c.more === !0 ? (b.detach().appendTo(a).text(L(e.opts.formatLoadMore, d + 1)), window.setTimeout(function () {
                            e.loadMoreIfNeeded()
                        }, 10)) : b.remove(), e.positionDropdown(), e.resultsPage = d, e.context = c.context, this.opts.element.trigger({
                            type: "select2-loaded",
                            items: c
                        }))
                    })
                })))
            }, tokenize: function () {
            }, updateResults: function (c) {
                function m() {
                    d.removeClass("select2-active"), h.positionDropdown(), e.find(".select2-no-results,.select2-selection-limit,.select2-searching").length ? h.liveRegion.text(e.text()) : h.liveRegion.text(h.opts.formatMatches(e.find(".select2-result-selectable").length))
                }

                function n(a) {
                    e.html(a), m()
                }

                var g, i, l, d = this.search, e = this.results, f = this.opts, h = this, j = d.val(),
                    k = a.data(this.container, "select2-last-term");
                if ((c === !0 || !k || !r(j, k)) && (a.data(this.container, "select2-last-term", j), c === !0 || this.showSearchInput !== !1 && this.opened())) {
                    l = ++this.queryCount;
                    var o = this.getMaximumSelectionSize();
                    if (o >= 1 && (g = this.data(), a.isArray(g) && g.length >= o && K(f.formatSelectionTooBig, "formatSelectionTooBig"))) return n("<li class='select2-selection-limit'>" + L(f.formatSelectionTooBig, o) + "</li>"), void 0;
                    if (d.val().length < f.minimumInputLength) return K(f.formatInputTooShort, "formatInputTooShort") ? n("<li class='select2-no-results'>" + L(f.formatInputTooShort, d.val(), f.minimumInputLength) + "</li>") : n(""), c && this.showSearch && this.showSearch(!0), void 0;
                    if (f.maximumInputLength && d.val().length > f.maximumInputLength) return K(f.formatInputTooLong, "formatInputTooLong") ? n("<li class='select2-no-results'>" + L(f.formatInputTooLong, d.val(), f.maximumInputLength) + "</li>") : n(""), void 0;
                    f.formatSearching && 0 === this.findHighlightableChoices().length && n("<li class='select2-searching'>" + L(f.formatSearching) + "</li>"), d.addClass("select2-active"), this.removeHighlight(), i = this.tokenize(), i != b && null != i && d.val(i), this.resultsPage = 1, f.query({
                        element: f.element,
                        term: d.val(),
                        page: this.resultsPage,
                        context: null,
                        matcher: f.matcher,
                        callback: this.bind(function (g) {
                            var i;
                            if (l == this.queryCount) {
                                if (!this.opened()) return this.search.removeClass("select2-active"), void 0;
                                if (this.context = g.context === b ? null : g.context, this.opts.createSearchChoice && "" !== d.val() && (i = this.opts.createSearchChoice.call(h, d.val(), g.results), i !== b && null !== i && h.id(i) !== b && null !== h.id(i) && 0 === a(g.results).filter(function () {
                                    return r(h.id(this), h.id(i))
                                }).length && this.opts.createSearchChoicePosition(g.results, i)), 0 === g.results.length && K(f.formatNoMatches, "formatNoMatches")) return n("<li class='select2-no-results'>" + L(f.formatNoMatches, d.val()) + "</li>"), void 0;
                                e.empty(), h.opts.populateResults.call(this, e, g.results, {
                                    term: d.val(),
                                    page: this.resultsPage,
                                    context: null
                                }), g.more === !0 && K(f.formatLoadMore, "formatLoadMore") && (e.append("<li class='select2-more-results'>" + h.opts.escapeMarkup(L(f.formatLoadMore, this.resultsPage)) + "</li>"), window.setTimeout(function () {
                                    h.loadMoreIfNeeded()
                                }, 10)), this.postprocessResults(g, c), m(), this.opts.element.trigger({
                                    type: "select2-loaded",
                                    items: g
                                })
                            }
                        })
                    })
                }
            }, cancel: function () {
                this.close()
            }, blur: function () {
                this.opts.selectOnBlur && this.selectHighlighted({noFocus: !0}), this.close(), this.container.removeClass("select2-container-active"), this.search[0] === document.activeElement && this.search.blur(), this.clearSearch(), this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus")
            }, focusSearch: function () {
                z(this.search)
            }, selectHighlighted: function (a) {
                if (this._touchMoved) return this.clearTouchMoved(), void 0;
                var b = this.highlight(), c = this.results.find(".select2-highlighted"),
                    d = c.closest(".select2-result").data("select2-data");
                d ? (this.highlight(b), this.onSelect(d, a)) : a && a.noFocus && this.close()
            }, getPlaceholder: function () {
                var a;
                return this.opts.element.attr("placeholder") || this.opts.element.attr("data-placeholder") || this.opts.element.data("placeholder") || this.opts.placeholder || ((a = this.getPlaceholderOption()) !== b ? a.text() : b)
            }, getPlaceholderOption: function () {
                if (this.select) {
                    var a = this.select.children("option").first();
                    if (this.opts.placeholderOption !== b) return "first" === this.opts.placeholderOption && a || "function" == typeof this.opts.placeholderOption && this.opts.placeholderOption(this.select);
                    if ("" === a.text() && "" === a.val()) return a
                }
            }, initContainerWidth: function () {
                function c() {
                    var c, d, e, f, g, h;
                    if ("off" === this.opts.width) return null;
                    if ("element" === this.opts.width) return 0 === this.opts.element.outerWidth(!1) ? "auto" : this.opts.element.outerWidth(!1) + "px";
                    if ("copy" === this.opts.width || "resolve" === this.opts.width) {
                        if (c = this.opts.element.attr("style"), c !== b) for (d = c.split(";"), f = 0, g = d.length; g > f; f += 1) if (h = d[f].replace(/\s/g, ""), e = h.match(/^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i), null !== e && e.length >= 1) return e[1];
                        return "resolve" === this.opts.width ? (c = this.opts.element.css("width"), c.indexOf("%") > 0 ? c : 0 === this.opts.element.outerWidth(!1) ? "auto" : this.opts.element.outerWidth(!1) + "px") : null
                    }
                    return a.isFunction(this.opts.width) ? this.opts.width() : this.opts.width
                }

                var d = c.call(this);
                null !== d && this.container.css("width", d)
            }
        }), e = O(d, {
            createContainer: function () {
                var b = a(document.createElement("div")).attr({"class": "select2-container"}).html(["<a href='javascript:void(0)' class='select2-choice' tabindex='-1'>", "   <span class='select2-chosen'>&nbsp;</span><abbr class='select2-search-choice-close'></abbr>", "   <span class='select2-arrow' role='presentation'><b role='presentation'></b></span>", "</a>", "<label for='' class='select2-offscreen'></label>", "<input class='select2-focusser select2-offscreen' type='text' aria-haspopup='true' role='button' />", "<div class='select2-drop select2-display-none'>", "   <div class='select2-search'>", "       <label for='' class='select2-offscreen'></label>", "       <input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' class='select2-input' role='combobox' aria-expanded='true'", "       aria-autocomplete='list' />", "   </div>", "   <ul class='select2-results' role='listbox'>", "   </ul>", "</div>"].join(""));
                return b
            }, enableInterface: function () {
                this.parent.enableInterface.apply(this, arguments) && this.focusser.prop("disabled", !this.isInterfaceEnabled())
            }, opening: function () {
                var c, d, e;
                this.opts.minimumResultsForSearch >= 0 && this.showSearch(!0), this.parent.opening.apply(this, arguments), this.showSearchInput !== !1 && this.search.val(this.focusser.val()), this.search.focus(), c = this.search.get(0), c.createTextRange ? (d = c.createTextRange(), d.collapse(!1), d.select()) : c.setSelectionRange && (e = this.search.val().length, c.setSelectionRange(e, e)), "" === this.search.val() && this.nextSearchTerm != b && (this.search.val(this.nextSearchTerm), this.search.select()), this.focusser.prop("disabled", !0).val(""), this.updateResults(!0), this.opts.element.trigger(a.Event("select2-open"))
            }, close: function () {
                this.opened() && (this.parent.close.apply(this, arguments), this.focusser.prop("disabled", !1), this.opts.shouldFocusInput(this) && this.focusser.focus())
            }, focus: function () {
                this.opened() ? this.close() : (this.focusser.prop("disabled", !1), this.opts.shouldFocusInput(this) && this.focusser.focus())
            }, isFocused: function () {
                return this.container.hasClass("select2-container-active")
            }, cancel: function () {
                this.parent.cancel.apply(this, arguments), this.focusser.prop("disabled", !1), this.opts.shouldFocusInput(this) && this.focusser.focus()
            }, destroy: function () {
                a("label[for='" + this.focusser.attr("id") + "']").attr("for", this.opts.element.attr("id")), this.parent.destroy.apply(this, arguments)
            }, initContainer: function () {
                var b, h, d = this.container, e = this.dropdown, f = g();
                this.opts.minimumResultsForSearch < 0 ? this.showSearch(!1) : this.showSearch(!0), this.selection = b = d.find(".select2-choice"), this.focusser = d.find(".select2-focusser"), b.find(".select2-chosen").attr("id", "select2-chosen-" + f), this.focusser.attr("aria-labelledby", "select2-chosen-" + f), this.results.attr("id", "select2-results-" + f), this.search.attr("aria-owns", "select2-results-" + f), this.focusser.attr("id", "s2id_autogen" + f), h = a("label[for='" + this.opts.element.attr("id") + "']"), this.focusser.prev().text(h.text()).attr("for", this.focusser.attr("id"));
                var i = this.opts.element.attr("title");
                this.opts.element.attr("title", i || h.text()), this.focusser.attr("tabindex", this.elementTabIndex), this.search.attr("id", this.focusser.attr("id") + "_search"), this.search.prev().text(a("label[for='" + this.focusser.attr("id") + "']").text()).attr("for", this.search.attr("id")), this.search.on("keydown", this.bind(function (a) {
                    if (this.isInterfaceEnabled()) {
                        if (a.which === c.PAGE_UP || a.which === c.PAGE_DOWN) return B(a), void 0;
                        switch (a.which) {
                            case c.UP:
                            case c.DOWN:
                                return this.moveHighlight(a.which === c.UP ? -1 : 1), B(a), void 0;
                            case c.ENTER:
                                return this.selectHighlighted(), B(a), void 0;
                            case c.TAB:
                                return this.selectHighlighted({noFocus: !0}), void 0;
                            case c.ESC:
                                return this.cancel(a), B(a), void 0
                        }
                    }
                })), this.search.on("blur", this.bind(function () {
                    document.activeElement === this.body().get(0) && window.setTimeout(this.bind(function () {
                        this.opened() && this.search.focus()
                    }), 0)
                })), this.focusser.on("keydown", this.bind(function (a) {
                    if (this.isInterfaceEnabled() && a.which !== c.TAB && !c.isControl(a) && !c.isFunctionKey(a) && a.which !== c.ESC) {
                        if (this.opts.openOnEnter === !1 && a.which === c.ENTER) return B(a), void 0;
                        if (a.which == c.DOWN || a.which == c.UP || a.which == c.ENTER && this.opts.openOnEnter) {
                            if (a.altKey || a.ctrlKey || a.shiftKey || a.metaKey) return;
                            return this.open(), B(a), void 0
                        }
                        return a.which == c.DELETE || a.which == c.BACKSPACE ? (this.opts.allowClear && this.clear(), B(a), void 0) : void 0
                    }
                })), u(this.focusser), this.focusser.on("keyup-change input", this.bind(function (a) {
                    if (this.opts.minimumResultsForSearch >= 0) {
                        if (a.stopPropagation(), this.opened()) return;
                        this.open()
                    }
                })), b.on("mousedown touchstart", "abbr", this.bind(function (a) {
                    this.isInterfaceEnabled() && (this.clear(), C(a), this.close(), this.selection.focus())
                })), b.on("mousedown touchstart", this.bind(function (c) {
                    n(b), this.container.hasClass("select2-container-active") || this.opts.element.trigger(a.Event("select2-focus")), this.opened() ? this.close() : this.isInterfaceEnabled() && this.open(), B(c)
                })), e.on("mousedown touchstart", this.bind(function () {
                    this.search.focus()
                })), b.on("focus", this.bind(function (a) {
                    B(a)
                })), this.focusser.on("focus", this.bind(function () {
                    this.container.hasClass("select2-container-active") || this.opts.element.trigger(a.Event("select2-focus")), this.container.addClass("select2-container-active")
                })).on("blur", this.bind(function () {
                    this.opened() || (this.container.removeClass("select2-container-active"), this.opts.element.trigger(a.Event("select2-blur")))
                })), this.search.on("focus", this.bind(function () {
                    this.container.hasClass("select2-container-active") || this.opts.element.trigger(a.Event("select2-focus")), this.container.addClass("select2-container-active")
                })), this.initContainerWidth(), this.opts.element.addClass("select2-offscreen"), this.setPlaceholder()
            }, clear: function (b) {
                var c = this.selection.data("select2-data");
                if (c) {
                    var d = a.Event("select2-clearing");
                    if (this.opts.element.trigger(d), d.isDefaultPrevented()) return;
                    var e = this.getPlaceholderOption();
                    this.opts.element.val(e ? e.val() : ""), this.selection.find(".select2-chosen").empty(), this.selection.removeData("select2-data"), this.setPlaceholder(), b !== !1 && (this.opts.element.trigger({
                        type: "select2-removed",
                        val: this.id(c),
                        choice: c
                    }), this.triggerChange({removed: c}))
                }
            }, initSelection: function () {
                if (this.isPlaceholderOptionSelected()) this.updateSelection(null), this.close(), this.setPlaceholder(); else {
                    var c = this;
                    this.opts.initSelection.call(null, this.opts.element, function (a) {
                        a !== b && null !== a && (c.updateSelection(a), c.close(), c.setPlaceholder(), c.nextSearchTerm = c.opts.nextSearchTerm(a, c.search.val()))
                    })
                }
            }, isPlaceholderOptionSelected: function () {
                var a;
                return this.getPlaceholder() ? (a = this.getPlaceholderOption()) !== b && a.prop("selected") || "" === this.opts.element.val() || this.opts.element.val() === b || null === this.opts.element.val() : !1
            }, prepareOpts: function () {
                var b = this.parent.prepareOpts.apply(this, arguments), c = this;
                return "select" === b.element.get(0).tagName.toLowerCase() ? b.initSelection = function (a, b) {
                    var d = a.find("option").filter(function () {
                        return this.selected && !this.disabled
                    });
                    b(c.optionToData(d))
                } : "data" in b && (b.initSelection = b.initSelection || function (c, d) {
                    var e = c.val(), f = null;
                    b.query({
                        matcher: function (a, c, d) {
                            var g = r(e, b.id(d));
                            return g && (f = d), g
                        }, callback: a.isFunction(d) ? function () {
                            d(f)
                        } : a.noop
                    })
                }), b
            }, getPlaceholder: function () {
                return this.select && this.getPlaceholderOption() === b ? b : this.parent.getPlaceholder.apply(this, arguments)
            }, setPlaceholder: function () {
                var a = this.getPlaceholder();
                if (this.isPlaceholderOptionSelected() && a !== b) {
                    if (this.select && this.getPlaceholderOption() === b) return;
                    this.selection.find(".select2-chosen").html(this.opts.escapeMarkup(a)), this.selection.addClass("select2-default"), this.container.removeClass("select2-allowclear")
                }
            }, postprocessResults: function (a, b, c) {
                var d = 0, e = this;
                if (this.findHighlightableChoices().each2(function (a, b) {
                    return r(e.id(b.data("select2-data")), e.opts.element.val()) ? (d = a, !1) : void 0
                }), c !== !1 && (b === !0 && d >= 0 ? this.highlight(d) : this.highlight(0)), b === !0) {
                    var g = this.opts.minimumResultsForSearch;
                    g >= 0 && this.showSearch(M(a.results) >= g)
                }
            }, showSearch: function (b) {
                this.showSearchInput !== b && (this.showSearchInput = b, this.dropdown.find(".select2-search").toggleClass("select2-search-hidden", !b), this.dropdown.find(".select2-search").toggleClass("select2-offscreen", !b), a(this.dropdown, this.container).toggleClass("select2-with-searchbox", b))
            }, onSelect: function (a, b) {
                if (this.triggerSelect(a)) {
                    var c = this.opts.element.val(), d = this.data();
                    this.opts.element.val(this.id(a)), this.updateSelection(a), this.opts.element.trigger({
                        type: "select2-selected",
                        val: this.id(a),
                        choice: a
                    }), this.nextSearchTerm = this.opts.nextSearchTerm(a, this.search.val()), this.close(), b && b.noFocus || !this.opts.shouldFocusInput(this) || this.focusser.focus(), r(c, this.id(a)) || this.triggerChange({
                        added: a,
                        removed: d
                    })
                }
            }, updateSelection: function (a) {
                var d, e, c = this.selection.find(".select2-chosen");
                this.selection.data("select2-data", a), c.empty(), null !== a && (d = this.opts.formatSelection(a, c, this.opts.escapeMarkup)), d !== b && c.append(d), e = this.opts.formatSelectionCssClass(a, c), e !== b && c.addClass(e), this.selection.removeClass("select2-default"), this.opts.allowClear && this.getPlaceholder() !== b && this.container.addClass("select2-allowclear")
            }, val: function () {
                var a, c = !1, d = null, e = this, f = this.data();
                if (0 === arguments.length) return this.opts.element.val();
                if (a = arguments[0], arguments.length > 1 && (c = arguments[1]), this.select) this.select.val(a).find("option").filter(function () {
                    return this.selected
                }).each2(function (a, b) {
                    return d = e.optionToData(b), !1
                }), this.updateSelection(d), this.setPlaceholder(), c && this.triggerChange({
                    added: d,
                    removed: f
                }); else {
                    if (!a && 0 !== a) return this.clear(c), void 0;
                    if (this.opts.initSelection === b) throw new Error("cannot call val() if initSelection() is not defined");
                    this.opts.element.val(a), this.opts.initSelection(this.opts.element, function (a) {
                        e.opts.element.val(a ? e.id(a) : ""), e.updateSelection(a), e.setPlaceholder(), c && e.triggerChange({
                            added: a,
                            removed: f
                        })
                    })
                }
            }, clearSearch: function () {
                this.search.val(""), this.focusser.val("")
            }, data: function (a) {
                var c, d = !1;
                return 0 === arguments.length ? (c = this.selection.data("select2-data"), c == b && (c = null), c) : (arguments.length > 1 && (d = arguments[1]), a ? (c = this.data(), this.opts.element.val(a ? this.id(a) : ""), this.updateSelection(a), d && this.triggerChange({
                    added: a,
                    removed: c
                })) : this.clear(d), void 0)
            }
        }), f = O(d, {
            createContainer: function () {
                var b = a(document.createElement("div")).attr({"class": "select2-container select2-container-multi"}).html(["<ul class='select2-choices'>", "  <li class='select2-search-field'>", "    <label for='' class='select2-offscreen'></label>", "    <input type='text' autocomplete='off' autocorrect='off' autocapitalize='off' spellcheck='false' class='select2-input'>", "  </li>", "</ul>", "<div class='select2-drop select2-drop-multi select2-display-none'>", "   <ul class='select2-results'>", "   </ul>", "</div>"].join(""));
                return b
            }, prepareOpts: function () {
                var b = this.parent.prepareOpts.apply(this, arguments), c = this;
                return "select" === b.element.get(0).tagName.toLowerCase() ? b.initSelection = function (a, b) {
                    var d = [];
                    a.find("option").filter(function () {
                        return this.selected && !this.disabled
                    }).each2(function (a, b) {
                        d.push(c.optionToData(b))
                    }), b(d)
                } : "data" in b && (b.initSelection = b.initSelection || function (c, d) {
                    var e = s(c.val(), b.separator), f = [];
                    b.query({
                        matcher: function (c, d, g) {
                            var h = a.grep(e, function (a) {
                                return r(a, b.id(g))
                            }).length;
                            return h && f.push(g), h
                        }, callback: a.isFunction(d) ? function () {
                            for (var a = [], c = 0; c < e.length; c++) for (var g = e[c], h = 0; h < f.length; h++) {
                                var i = f[h];
                                if (r(g, b.id(i))) {
                                    a.push(i), f.splice(h, 1);
                                    break
                                }
                            }
                            d(a)
                        } : a.noop
                    })
                }), b
            }, selectChoice: function (a) {
                var b = this.container.find(".select2-search-choice-focus");
                b.length && a && a[0] == b[0] || (b.length && this.opts.element.trigger("choice-deselected", b), b.removeClass("select2-search-choice-focus"), a && a.length && (this.close(), a.addClass("select2-search-choice-focus"), this.opts.element.trigger("choice-selected", a)))
            }, destroy: function () {
                a("label[for='" + this.search.attr("id") + "']").attr("for", this.opts.element.attr("id")), this.parent.destroy.apply(this, arguments)
            }, initContainer: function () {
                var d, b = ".select2-choices";
                this.searchContainer = this.container.find(".select2-search-field"), this.selection = d = this.container.find(b);
                var e = this;
                this.selection.on("click", ".select2-search-choice:not(.select2-locked)", function () {
                    e.search[0].focus(), e.selectChoice(a(this))
                }), this.search.attr("id", "s2id_autogen" + g()), this.search.prev().text(a("label[for='" + this.opts.element.attr("id") + "']").text()).attr("for", this.search.attr("id")), this.search.on("input paste", this.bind(function () {
                    this.isInterfaceEnabled() && (this.opened() || this.open())
                })), this.search.attr("tabindex", this.elementTabIndex), this.keydowns = 0, this.search.on("keydown", this.bind(function (a) {
                    if (this.isInterfaceEnabled()) {
                        ++this.keydowns;
                        var b = d.find(".select2-search-choice-focus"),
                            e = b.prev(".select2-search-choice:not(.select2-locked)"),
                            f = b.next(".select2-search-choice:not(.select2-locked)"), g = A(this.search);
                        if (b.length && (a.which == c.LEFT || a.which == c.RIGHT || a.which == c.BACKSPACE || a.which == c.DELETE || a.which == c.ENTER)) {
                            var h = b;
                            return a.which == c.LEFT && e.length ? h = e : a.which == c.RIGHT ? h = f.length ? f : null : a.which === c.BACKSPACE ? this.unselect(b.first()) && (this.search.width(10), h = e.length ? e : f) : a.which == c.DELETE ? this.unselect(b.first()) && (this.search.width(10), h = f.length ? f : null) : a.which == c.ENTER && (h = null), this.selectChoice(h), B(a), h && h.length || this.open(), void 0
                        }
                        if ((a.which === c.BACKSPACE && 1 == this.keydowns || a.which == c.LEFT) && 0 == g.offset && !g.length) return this.selectChoice(d.find(".select2-search-choice:not(.select2-locked)").last()), B(a), void 0;
                        if (this.selectChoice(null), this.opened()) switch (a.which) {
                            case c.UP:
                            case c.DOWN:
                                return this.moveHighlight(a.which === c.UP ? -1 : 1), B(a), void 0;
                            case c.ENTER:
                                return this.selectHighlighted(), B(a), void 0;
                            case c.TAB:
                                return this.selectHighlighted({noFocus: !0}), this.close(), void 0;
                            case c.ESC:
                                return this.cancel(a), B(a), void 0
                        }
                        if (a.which !== c.TAB && !c.isControl(a) && !c.isFunctionKey(a) && a.which !== c.BACKSPACE && a.which !== c.ESC) {
                            if (a.which === c.ENTER) {
                                if (this.opts.openOnEnter === !1) return;
                                if (a.altKey || a.ctrlKey || a.shiftKey || a.metaKey) return
                            }
                            this.open(), (a.which === c.PAGE_UP || a.which === c.PAGE_DOWN) && B(a), a.which === c.ENTER && B(a)
                        }
                    }
                })), this.search.on("keyup", this.bind(function () {
                    this.keydowns = 0, this.resizeSearch()
                })), this.search.on("blur", this.bind(function (b) {
                    this.container.removeClass("select2-container-active"), this.search.removeClass("select2-focused"), this.selectChoice(null), this.opened() || this.clearSearch(), b.stopImmediatePropagation(), this.opts.element.trigger(a.Event("select2-blur"))
                })), this.container.on("click", b, this.bind(function (b) {
                    this.isInterfaceEnabled() && (a(b.target).closest(".select2-search-choice").length > 0 || (this.selectChoice(null), this.clearPlaceholder(), this.container.hasClass("select2-container-active") || this.opts.element.trigger(a.Event("select2-focus")), this.open(), this.focusSearch(), b.preventDefault()))
                })), this.container.on("focus", b, this.bind(function () {
                    this.isInterfaceEnabled() && (this.container.hasClass("select2-container-active") || this.opts.element.trigger(a.Event("select2-focus")), this.container.addClass("select2-container-active"), this.dropdown.addClass("select2-drop-active"), this.clearPlaceholder())
                })), this.initContainerWidth(), this.opts.element.addClass("select2-offscreen"), this.clearSearch()
            }, enableInterface: function () {
                this.parent.enableInterface.apply(this, arguments) && this.search.prop("disabled", !this.isInterfaceEnabled())
            }, initSelection: function () {
                if ("" === this.opts.element.val() && "" === this.opts.element.text() && (this.updateSelection([]), this.close(), this.clearSearch()), this.select || "" !== this.opts.element.val()) {
                    var c = this;
                    this.opts.initSelection.call(null, this.opts.element, function (a) {
                        a !== b && null !== a && (c.updateSelection(a), c.close(), c.clearSearch())
                    })
                }
            }, clearSearch: function () {
                var a = this.getPlaceholder(), c = this.getMaxSearchWidth();
                a !== b && 0 === this.getVal().length && this.search.hasClass("select2-focused") === !1 ? (this.search.val(a).addClass("select2-default"), this.search.width(c > 0 ? c : this.container.css("width"))) : this.search.val("").width(10)
            }, clearPlaceholder: function () {
                this.search.hasClass("select2-default") && this.search.val("").removeClass("select2-default")
            }, opening: function () {
                this.clearPlaceholder(), this.resizeSearch(), this.parent.opening.apply(this, arguments), this.focusSearch(), "" === this.search.val() && this.nextSearchTerm != b && (this.search.val(this.nextSearchTerm), this.search.select()), this.updateResults(!0), this.search.focus(), this.opts.element.trigger(a.Event("select2-open"))
            }, close: function () {
                this.opened() && this.parent.close.apply(this, arguments)
            }, focus: function () {
                this.close(), this.search.focus()
            }, isFocused: function () {
                return this.search.hasClass("select2-focused")
            }, updateSelection: function (b) {
                var c = [], d = [], e = this;
                a(b).each(function () {
                    p(e.id(this), c) < 0 && (c.push(e.id(this)), d.push(this))
                }), b = d, this.selection.find(".select2-search-choice").remove(), a(b).each(function () {
                    e.addSelectedChoice(this)
                }), e.postprocessResults()
            }, tokenize: function () {
                var a = this.search.val();
                a = this.opts.tokenizer.call(this, a, this.data(), this.bind(this.onSelect), this.opts), null != a && a != b && (this.search.val(a), a.length > 0 && this.open())
            }, onSelect: function (a, c) {
                this.triggerSelect(a) && (this.addSelectedChoice(a), this.opts.element.trigger({
                    type: "selected",
                    val: this.id(a),
                    choice: a
                }), this.nextSearchTerm = this.opts.nextSearchTerm(a, this.search.val()), this.clearSearch(), this.updateResults(), (this.select || !this.opts.closeOnSelect) && this.postprocessResults(a, !1, this.opts.closeOnSelect === !0), this.opts.closeOnSelect ? (this.close(), this.search.width(10)) : this.countSelectableResults() > 0 ? (this.search.width(10), this.resizeSearch(), this.getMaximumSelectionSize() > 0 && this.val().length >= this.getMaximumSelectionSize() ? this.updateResults(!0) : this.nextSearchTerm != b && (this.search.val(this.nextSearchTerm), this.updateResults(), this.search.select()), this.positionDropdown()) : (this.close(), this.search.width(10)), this.triggerChange({added: a}), c && c.noFocus || this.focusSearch())
            }, cancel: function () {
                this.close(), this.focusSearch()
            }, addSelectedChoice: function (c) {
                var j, k, d = !c.locked,
                    e = a("<li class='select2-search-choice'>    <div></div>    <a href='#' class='select2-search-choice-close' tabindex='-1'></a></li>"),
                    f = a("<li class='select2-search-choice select2-locked'><div></div></li>"), g = d ? e : f,
                    h = this.id(c), i = this.getVal();
                j = this.opts.formatSelection(c, g.find("div"), this.opts.escapeMarkup), j != b && g.find("div").replaceWith("<div>" + j + "</div>"), k = this.opts.formatSelectionCssClass(c, g.find("div")), k != b && g.addClass(k), d && g.find(".select2-search-choice-close").on("mousedown", B).on("click dblclick", this.bind(function (b) {
                    this.isInterfaceEnabled() && (this.unselect(a(b.target)), this.selection.find(".select2-search-choice-focus").removeClass("select2-search-choice-focus"), B(b), this.close(), this.focusSearch())
                })).on("focus", this.bind(function () {
                    this.isInterfaceEnabled() && (this.container.addClass("select2-container-active"), this.dropdown.addClass("select2-drop-active"))
                })), g.data("select2-data", c), g.insertBefore(this.searchContainer), i.push(h), this.setVal(i)
            }, unselect: function (b) {
                var d, e, c = this.getVal();
                if (b = b.closest(".select2-search-choice"), 0 === b.length) throw"Invalid argument: " + b + ". Must be .select2-search-choice";
                if (d = b.data("select2-data")) {
                    var f = a.Event("select2-removing");
                    if (f.val = this.id(d), f.choice = d, this.opts.element.trigger(f), f.isDefaultPrevented()) return !1;
                    for (; (e = p(this.id(d), c)) >= 0;) c.splice(e, 1), this.setVal(c), this.select && this.postprocessResults();
                    return b.remove(), this.opts.element.trigger({
                        type: "select2-removed",
                        val: this.id(d),
                        choice: d
                    }), this.triggerChange({removed: d}), !0
                }
            }, postprocessResults: function (a, b, c) {
                var d = this.getVal(), e = this.results.find(".select2-result"),
                    f = this.results.find(".select2-result-with-children"), g = this;
                e.each2(function (a, b) {
                    var c = g.id(b.data("select2-data"));
                    p(c, d) >= 0 && (b.addClass("select2-selected"), b.find(".select2-result-selectable").addClass("select2-selected"))
                }), f.each2(function (a, b) {
                    b.is(".select2-result-selectable") || 0 !== b.find(".select2-result-selectable:not(.select2-selected)").length || b.addClass("select2-selected")
                }), -1 == this.highlight() && c !== !1 && g.highlight(0), !this.opts.createSearchChoice && !e.filter(".select2-result:not(.select2-selected)").length > 0 && (!a || a && !a.more && 0 === this.results.find(".select2-no-results").length) && K(g.opts.formatNoMatches, "formatNoMatches") && this.results.append("<li class='select2-no-results'>" + L(g.opts.formatNoMatches, g.search.val()) + "</li>")
            }, getMaxSearchWidth: function () {
                return this.selection.width() - t(this.search)
            }, resizeSearch: function () {
                var a, b, c, d, e, f = t(this.search);
                a = D(this.search) + 10, b = this.search.offset().left, c = this.selection.width(), d = this.selection.offset().left, e = c - (b - d) - f, a > e && (e = c - f), 40 > e && (e = c - f), 0 >= e && (e = a), this.search.width(Math.floor(e))
            }, getVal: function () {
                var a;
                return this.select ? (a = this.select.val(), null === a ? [] : a) : (a = this.opts.element.val(), s(a, this.opts.separator))
            }, setVal: function (b) {
                var c;
                this.select ? this.select.val(b) : (c = [], a(b).each(function () {
                    p(this, c) < 0 && c.push(this)
                }), this.opts.element.val(0 === c.length ? "" : c.join(this.opts.separator)))
            }, buildChangeDetails: function (a, b) {
                for (var b = b.slice(0), a = a.slice(0), c = 0; c < b.length; c++) for (var d = 0; d < a.length; d++) r(this.opts.id(b[c]), this.opts.id(a[d])) && (b.splice(c, 1), c > 0 && c--, a.splice(d, 1), d--);
                return {added: b, removed: a}
            }, val: function (c, d) {
                var e, f = this;
                if (0 === arguments.length) return this.getVal();
                if (e = this.data(), e.length || (e = []), !c && 0 !== c) return this.opts.element.val(""), this.updateSelection([]), this.clearSearch(), d && this.triggerChange({
                    added: this.data(),
                    removed: e
                }), void 0;
                if (this.setVal(c), this.select) this.opts.initSelection(this.select, this.bind(this.updateSelection)), d && this.triggerChange(this.buildChangeDetails(e, this.data())); else {
                    if (this.opts.initSelection === b) throw new Error("val() cannot be called if initSelection() is not defined");
                    this.opts.initSelection(this.opts.element, function (b) {
                        var c = a.map(b, f.id);
                        f.setVal(c), f.updateSelection(b), f.clearSearch(), d && f.triggerChange(f.buildChangeDetails(e, f.data()))
                    })
                }
                this.clearSearch()
            }, onSortStart: function () {
                if (this.select) throw new Error("Sorting of elements is not supported when attached to <select>. Attach to <input type='hidden'/> instead.");
                this.search.width(0), this.searchContainer.hide()
            }, onSortEnd: function () {
                var b = [], c = this;
                this.searchContainer.show(), this.searchContainer.appendTo(this.searchContainer.parent()), this.resizeSearch(), this.selection.find(".select2-search-choice").each(function () {
                    b.push(c.opts.id(a(this).data("select2-data")))
                }), this.setVal(b), this.triggerChange()
            }, data: function (b, c) {
                var e, f, d = this;
                return 0 === arguments.length ? this.selection.children(".select2-search-choice").map(function () {
                    return a(this).data("select2-data")
                }).get() : (f = this.data(), b || (b = []), e = a.map(b, function (a) {
                    return d.opts.id(a)
                }), this.setVal(e), this.updateSelection(b), this.clearSearch(), c && this.triggerChange(this.buildChangeDetails(f, this.data())), void 0)
            }
        }), a.fn.select2 = function () {
            var d, e, f, g, h, c = Array.prototype.slice.call(arguments, 0),
                i = ["val", "destroy", "opened", "open", "close", "focus", "isFocused", "container", "dropdown", "onSortStart", "onSortEnd", "enable", "disable", "readonly", "positionDropdown", "data", "search"],
                j = ["opened", "isFocused", "container", "dropdown"], k = ["val", "data"],
                l = {search: "externalSearch"};
            return this.each(function () {
                if (0 === c.length || "object" == typeof c[0]) d = 0 === c.length ? {} : a.extend({}, c[0]), d.element = a(this), "select" === d.element.get(0).tagName.toLowerCase() ? h = d.element.prop("multiple") : (h = d.multiple || !1, "tags" in d && (d.multiple = h = !0)), e = h ? new window.Select2["class"].multi : new window.Select2["class"].single, e.init(d); else {
                    if ("string" != typeof c[0]) throw"Invalid arguments to select2 plugin: " + c;
                    if (p(c[0], i) < 0) throw"Unknown method: " + c[0];
                    if (g = b, e = a(this).data("select2"), e === b) return;
                    if (f = c[0], "container" === f ? g = e.container : "dropdown" === f ? g = e.dropdown : (l[f] && (f = l[f]), g = e[f].apply(e, c.slice(1))), p(c[0], j) >= 0 || p(c[0], k) && 1 == c.length) return !1
                }
            }), g === b ? this : g
        }, a.fn.select2.defaults = {
            width: "copy",
            loadMorePadding: 0,
            closeOnSelect: !0,
            openOnEnter: !0,
            containerCss: {},
            dropdownCss: {},
            containerCssClass: "",
            dropdownCssClass: "",
            formatResult: function (a, b, c, d) {
                var e = [];
                return F(a.text, c.term, e, d), e.join("")
            },
            formatSelection: function (a, c, d) {
                return a ? d(a.text) : b
            },
            sortResults: function (a) {
                return a
            },
            formatResultCssClass: function (a) {
                return a.css
            },
            formatSelectionCssClass: function () {
                return b
            },
            formatMatches: function (a) {
                return a + " results are available, use up and down arrow keys to navigate."
            },
            formatNoMatches: function () {
                return "No matches found"
            },
            formatInputTooShort: function (a, b) {
                var c = b - a.length;
                return "Please enter " + c + " or more character" + (1 == c ? "" : "s")
            },
            formatInputTooLong: function (a, b) {
                var c = a.length - b;
                return "Please delete " + c + " character" + (1 == c ? "" : "s")
            },
            formatSelectionTooBig: function (a) {
                return "You can only select " + a + " item" + (1 == a ? "" : "s")
            },
            formatLoadMore: function () {
                return "Loading more results\u2026"
            },
            formatSearching: function () {
                return "Searching\u2026"
            },
            minimumResultsForSearch: 0,
            minimumInputLength: 0,
            maximumInputLength: null,
            maximumSelectionSize: 0,
            id: function (a) {
                return a == b ? null : a.id
            },
            matcher: function (a, b) {
                return o("" + b).toUpperCase().indexOf(o("" + a).toUpperCase()) >= 0
            },
            separator: ",",
            tokenSeparators: [],
            tokenizer: N,
            escapeMarkup: G,
            blurOnChange: !1,
            selectOnBlur: !1,
            adaptContainerCssClass: function (a) {
                return a
            },
            adaptDropdownCssClass: function () {
                return null
            },
            nextSearchTerm: function () {
                return b
            },
            searchInputPlaceholder: "",
            createSearchChoicePosition: "top",
            shouldFocusInput: function (a) {
                return a.opts.minimumResultsForSearch < 0 ? !1 : !0
            }
        }, a.fn.select2.ajaxDefaults = {
            transport: a.ajax,
            params: {type: "GET", cache: !1, dataType: "json"}
        }, window.Select2 = {
            query: {ajax: H, local: I, tags: J},
            util: {debounce: w, markMatch: F, escapeMarkup: G, stripDiacritics: o},
            "class": {"abstract": d, single: e, multi: f}
        }
    }
}(jQuery);




/*!
   Copyright 2008-2020 SpryMedia Ltd.

 This source file is free software, available under the following license:
   MIT license - http://datatables.net/license

 This source file is distributed in the hope that it will be useful, but
 WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
 or FITNESS FOR A PARTICULAR PURPOSE. See the license files for details.

 For details please refer to: http://www.datatables.net
 DataTables 1.10.21
 ©2008-2020 SpryMedia Ltd - datatables.net/license
*/
var $jscomp=$jscomp||{};$jscomp.scope={};$jscomp.findInternal=function(f,y,w){f instanceof String&&(f=String(f));for(var n=f.length,H=0;H<n;H++){var L=f[H];if(y.call(w,L,H,f))return{i:H,v:L}}return{i:-1,v:void 0}};$jscomp.ASSUME_ES5=!1;$jscomp.ASSUME_NO_NATIVE_MAP=!1;$jscomp.ASSUME_NO_NATIVE_SET=!1;$jscomp.SIMPLE_FROUND_POLYFILL=!1;
$jscomp.defineProperty=$jscomp.ASSUME_ES5||"function"==typeof Object.defineProperties?Object.defineProperty:function(f,y,w){f!=Array.prototype&&f!=Object.prototype&&(f[y]=w.value)};$jscomp.getGlobal=function(f){f=["object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof global&&global,f];for(var y=0;y<f.length;++y){var w=f[y];if(w&&w.Math==Math)return w}throw Error("Cannot find global object");};$jscomp.global=$jscomp.getGlobal(this);
$jscomp.polyfill=function(f,y,w,n){if(y){w=$jscomp.global;f=f.split(".");for(n=0;n<f.length-1;n++){var H=f[n];H in w||(w[H]={});w=w[H]}f=f[f.length-1];n=w[f];y=y(n);y!=n&&null!=y&&$jscomp.defineProperty(w,f,{configurable:!0,writable:!0,value:y})}};$jscomp.polyfill("Array.prototype.find",function(f){return f?f:function(f,w){return $jscomp.findInternal(this,f,w).v}},"es6","es3");
(function(f){"function"===typeof define&&define.amd?define(["jquery"],function(y){return f(y,window,document)}):"object"===typeof exports?module.exports=function(y,w){y||(y=window);w||(w="undefined"!==typeof window?require("jquery"):require("jquery")(y));return f(w,y,y.document)}:f(jQuery,window,document)})(function(f,y,w,n){function H(a){var b,c,d={};f.each(a,function(e,h){(b=e.match(/^([^A-Z]+?)([A-Z])/))&&-1!=="a aa ai ao as b fn i m o s ".indexOf(b[1]+" ")&&(c=e.replace(b[0],b[2].toLowerCase()),
    d[c]=e,"o"===b[1]&&H(a[e]))});a._hungarianMap=d}function L(a,b,c){a._hungarianMap||H(a);var d;f.each(b,function(e,h){d=a._hungarianMap[e];d===n||!c&&b[d]!==n||("o"===d.charAt(0)?(b[d]||(b[d]={}),f.extend(!0,b[d],b[e]),L(a[d],b[d],c)):b[d]=b[e])})}function Fa(a){var b=q.defaults.oLanguage,c=b.sDecimal;c&&Ga(c);if(a){var d=a.sZeroRecords;!a.sEmptyTable&&d&&"No data available in table"===b.sEmptyTable&&M(a,a,"sZeroRecords","sEmptyTable");!a.sLoadingRecords&&d&&"Loading..."===b.sLoadingRecords&&M(a,a,
    "sZeroRecords","sLoadingRecords");a.sInfoThousands&&(a.sThousands=a.sInfoThousands);(a=a.sDecimal)&&c!==a&&Ga(a)}}function ib(a){E(a,"ordering","bSort");E(a,"orderMulti","bSortMulti");E(a,"orderClasses","bSortClasses");E(a,"orderCellsTop","bSortCellsTop");E(a,"order","aaSorting");E(a,"orderFixed","aaSortingFixed");E(a,"paging","bPaginate");E(a,"pagingType","sPaginationType");E(a,"pageLength","iDisplayLength");E(a,"searching","bFilter");"boolean"===typeof a.sScrollX&&(a.sScrollX=a.sScrollX?"100%":
    "");"boolean"===typeof a.scrollX&&(a.scrollX=a.scrollX?"100%":"");if(a=a.aoSearchCols)for(var b=0,c=a.length;b<c;b++)a[b]&&L(q.models.oSearch,a[b])}function jb(a){E(a,"orderable","bSortable");E(a,"orderData","aDataSort");E(a,"orderSequence","asSorting");E(a,"orderDataType","sortDataType");var b=a.aDataSort;"number"!==typeof b||f.isArray(b)||(a.aDataSort=[b])}function kb(a){if(!q.__browser){var b={};q.__browser=b;var c=f("<div/>").css({position:"fixed",top:0,left:-1*f(y).scrollLeft(),height:1,width:1,
    overflow:"hidden"}).append(f("<div/>").css({position:"absolute",top:1,left:1,width:100,overflow:"scroll"}).append(f("<div/>").css({width:"100%",height:10}))).appendTo("body"),d=c.children(),e=d.children();b.barWidth=d[0].offsetWidth-d[0].clientWidth;b.bScrollOversize=100===e[0].offsetWidth&&100!==d[0].clientWidth;b.bScrollbarLeft=1!==Math.round(e.offset().left);b.bBounding=c[0].getBoundingClientRect().width?!0:!1;c.remove()}f.extend(a.oBrowser,q.__browser);a.oScroll.iBarWidth=q.__browser.barWidth}
    function lb(a,b,c,d,e,h){var g=!1;if(c!==n){var k=c;g=!0}for(;d!==e;)a.hasOwnProperty(d)&&(k=g?b(k,a[d],d,a):a[d],g=!0,d+=h);return k}function Ha(a,b){var c=q.defaults.column,d=a.aoColumns.length;c=f.extend({},q.models.oColumn,c,{nTh:b?b:w.createElement("th"),sTitle:c.sTitle?c.sTitle:b?b.innerHTML:"",aDataSort:c.aDataSort?c.aDataSort:[d],mData:c.mData?c.mData:d,idx:d});a.aoColumns.push(c);c=a.aoPreSearchCols;c[d]=f.extend({},q.models.oSearch,c[d]);la(a,d,f(b).data())}function la(a,b,c){b=a.aoColumns[b];
        var d=a.oClasses,e=f(b.nTh);if(!b.sWidthOrig){b.sWidthOrig=e.attr("width")||null;var h=(e.attr("style")||"").match(/width:\s*(\d+[pxem%]+)/);h&&(b.sWidthOrig=h[1])}c!==n&&null!==c&&(jb(c),L(q.defaults.column,c,!0),c.mDataProp===n||c.mData||(c.mData=c.mDataProp),c.sType&&(b._sManualType=c.sType),c.className&&!c.sClass&&(c.sClass=c.className),c.sClass&&e.addClass(c.sClass),f.extend(b,c),M(b,c,"sWidth","sWidthOrig"),c.iDataSort!==n&&(b.aDataSort=[c.iDataSort]),M(b,c,"aDataSort"));var g=b.mData,k=T(g),
            l=b.mRender?T(b.mRender):null;c=function(a){return"string"===typeof a&&-1!==a.indexOf("@")};b._bAttrSrc=f.isPlainObject(g)&&(c(g.sort)||c(g.type)||c(g.filter));b._setter=null;b.fnGetData=function(a,b,c){var d=k(a,b,n,c);return l&&b?l(d,b,a,c):d};b.fnSetData=function(a,b,c){return Q(g)(a,b,c)};"number"!==typeof g&&(a._rowReadObject=!0);a.oFeatures.bSort||(b.bSortable=!1,e.addClass(d.sSortableNone));a=-1!==f.inArray("asc",b.asSorting);c=-1!==f.inArray("desc",b.asSorting);b.bSortable&&(a||c)?a&&!c?(b.sSortingClass=
            d.sSortableAsc,b.sSortingClassJUI=d.sSortJUIAscAllowed):!a&&c?(b.sSortingClass=d.sSortableDesc,b.sSortingClassJUI=d.sSortJUIDescAllowed):(b.sSortingClass=d.sSortable,b.sSortingClassJUI=d.sSortJUI):(b.sSortingClass=d.sSortableNone,b.sSortingClassJUI="")}function Z(a){if(!1!==a.oFeatures.bAutoWidth){var b=a.aoColumns;Ia(a);for(var c=0,d=b.length;c<d;c++)b[c].nTh.style.width=b[c].sWidth}b=a.oScroll;""===b.sY&&""===b.sX||ma(a);A(a,null,"column-sizing",[a])}function aa(a,b){a=na(a,"bVisible");return"number"===
    typeof a[b]?a[b]:null}function ba(a,b){a=na(a,"bVisible");b=f.inArray(b,a);return-1!==b?b:null}function V(a){var b=0;f.each(a.aoColumns,function(a,d){d.bVisible&&"none"!==f(d.nTh).css("display")&&b++});return b}function na(a,b){var c=[];f.map(a.aoColumns,function(a,e){a[b]&&c.push(e)});return c}function Ja(a){var b=a.aoColumns,c=a.aoData,d=q.ext.type.detect,e,h,g;var k=0;for(e=b.length;k<e;k++){var f=b[k];var m=[];if(!f.sType&&f._sManualType)f.sType=f._sManualType;else if(!f.sType){var p=0;for(h=
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           d.length;p<h;p++){var v=0;for(g=c.length;v<g;v++){m[v]===n&&(m[v]=F(a,v,k,"type"));var u=d[p](m[v],a);if(!u&&p!==d.length-1)break;if("html"===u)break}if(u){f.sType=u;break}}f.sType||(f.sType="string")}}}function mb(a,b,c,d){var e,h,g,k=a.aoColumns;if(b)for(e=b.length-1;0<=e;e--){var l=b[e];var m=l.targets!==n?l.targets:l.aTargets;f.isArray(m)||(m=[m]);var p=0;for(h=m.length;p<h;p++)if("number"===typeof m[p]&&0<=m[p]){for(;k.length<=m[p];)Ha(a);d(m[p],l)}else if("number"===typeof m[p]&&0>m[p])d(k.length+
        m[p],l);else if("string"===typeof m[p]){var v=0;for(g=k.length;v<g;v++)("_all"==m[p]||f(k[v].nTh).hasClass(m[p]))&&d(v,l)}}if(c)for(e=0,a=c.length;e<a;e++)d(e,c[e])}function R(a,b,c,d){var e=a.aoData.length,h=f.extend(!0,{},q.models.oRow,{src:c?"dom":"data",idx:e});h._aData=b;a.aoData.push(h);for(var g=a.aoColumns,k=0,l=g.length;k<l;k++)g[k].sType=null;a.aiDisplayMaster.push(e);b=a.rowIdFn(b);b!==n&&(a.aIds[b]=h);!c&&a.oFeatures.bDeferRender||Ka(a,e,c,d);return e}function oa(a,b){var c;b instanceof
    f||(b=f(b));return b.map(function(b,e){c=La(a,e);return R(a,c.data,e,c.cells)})}function F(a,b,c,d){var e=a.iDraw,h=a.aoColumns[c],g=a.aoData[b]._aData,k=h.sDefaultContent,f=h.fnGetData(g,d,{settings:a,row:b,col:c});if(f===n)return a.iDrawError!=e&&null===k&&(O(a,0,"Requested unknown parameter "+("function"==typeof h.mData?"{function}":"'"+h.mData+"'")+" for row "+b+", column "+c,4),a.iDrawError=e),k;if((f===g||null===f)&&null!==k&&d!==n)f=k;else if("function"===typeof f)return f.call(g);return null===
    f&&"display"==d?"":f}function nb(a,b,c,d){a.aoColumns[c].fnSetData(a.aoData[b]._aData,d,{settings:a,row:b,col:c})}function Ma(a){return f.map(a.match(/(\\.|[^\.])+/g)||[""],function(a){return a.replace(/\\\./g,".")})}function T(a){if(f.isPlainObject(a)){var b={};f.each(a,function(a,c){c&&(b[a]=T(c))});return function(a,c,h,g){var d=b[c]||b._;return d!==n?d(a,c,h,g):a}}if(null===a)return function(a){return a};if("function"===typeof a)return function(b,c,h,g){return a(b,c,h,g)};if("string"!==typeof a||
        -1===a.indexOf(".")&&-1===a.indexOf("[")&&-1===a.indexOf("("))return function(b,c){return b[a]};var c=function(a,b,h){if(""!==h){var d=Ma(h);for(var e=0,l=d.length;e<l;e++){h=d[e].match(ca);var m=d[e].match(W);if(h){d[e]=d[e].replace(ca,"");""!==d[e]&&(a=a[d[e]]);m=[];d.splice(0,e+1);d=d.join(".");if(f.isArray(a))for(e=0,l=a.length;e<l;e++)m.push(c(a[e],b,d));a=h[0].substring(1,h[0].length-1);a=""===a?m:m.join(a);break}else if(m){d[e]=d[e].replace(W,"");a=a[d[e]]();continue}if(null===a||a[d[e]]===
        n)return n;a=a[d[e]]}}return a};return function(b,e){return c(b,e,a)}}function Q(a){if(f.isPlainObject(a))return Q(a._);if(null===a)return function(){};if("function"===typeof a)return function(b,d,e){a(b,"set",d,e)};if("string"!==typeof a||-1===a.indexOf(".")&&-1===a.indexOf("[")&&-1===a.indexOf("("))return function(b,d){b[a]=d};var b=function(a,d,e){e=Ma(e);var c=e[e.length-1];for(var g,k,l=0,m=e.length-1;l<m;l++){g=e[l].match(ca);k=e[l].match(W);if(g){e[l]=e[l].replace(ca,"");a[e[l]]=[];c=e.slice();
        c.splice(0,l+1);g=c.join(".");if(f.isArray(d))for(k=0,m=d.length;k<m;k++)c={},b(c,d[k],g),a[e[l]].push(c);else a[e[l]]=d;return}k&&(e[l]=e[l].replace(W,""),a=a[e[l]](d));if(null===a[e[l]]||a[e[l]]===n)a[e[l]]={};a=a[e[l]]}if(c.match(W))a[c.replace(W,"")](d);else a[c.replace(ca,"")]=d};return function(c,d){return b(c,d,a)}}function Na(a){return K(a.aoData,"_aData")}function pa(a){a.aoData.length=0;a.aiDisplayMaster.length=0;a.aiDisplay.length=0;a.aIds={}}function qa(a,b,c){for(var d=-1,e=0,h=a.length;e<
    h;e++)a[e]==b?d=e:a[e]>b&&a[e]--; -1!=d&&c===n&&a.splice(d,1)}function da(a,b,c,d){var e=a.aoData[b],h,g=function(c,d){for(;c.childNodes.length;)c.removeChild(c.firstChild);c.innerHTML=F(a,b,d,"display")};if("dom"!==c&&(c&&"auto"!==c||"dom"!==e.src)){var k=e.anCells;if(k)if(d!==n)g(k[d],d);else for(c=0,h=k.length;c<h;c++)g(k[c],c)}else e._aData=La(a,e,d,d===n?n:e._aData).data;e._aSortData=null;e._aFilterData=null;g=a.aoColumns;if(d!==n)g[d].sType=null;else{c=0;for(h=g.length;c<h;c++)g[c].sType=null;
        Oa(a,e)}}function La(a,b,c,d){var e=[],h=b.firstChild,g,k=0,l,m=a.aoColumns,p=a._rowReadObject;d=d!==n?d:p?{}:[];var v=function(a,b){if("string"===typeof a){var c=a.indexOf("@");-1!==c&&(c=a.substring(c+1),Q(a)(d,b.getAttribute(c)))}},u=function(a){if(c===n||c===k)g=m[k],l=f.trim(a.innerHTML),g&&g._bAttrSrc?(Q(g.mData._)(d,l),v(g.mData.sort,a),v(g.mData.type,a),v(g.mData.filter,a)):p?(g._setter||(g._setter=Q(g.mData)),g._setter(d,l)):d[k]=l;k++};if(h)for(;h;){var q=h.nodeName.toUpperCase();if("TD"==
        q||"TH"==q)u(h),e.push(h);h=h.nextSibling}else for(e=b.anCells,h=0,q=e.length;h<q;h++)u(e[h]);(b=b.firstChild?b:b.nTr)&&(b=b.getAttribute("id"))&&Q(a.rowId)(d,b);return{data:d,cells:e}}function Ka(a,b,c,d){var e=a.aoData[b],h=e._aData,g=[],k,l;if(null===e.nTr){var m=c||w.createElement("tr");e.nTr=m;e.anCells=g;m._DT_RowIndex=b;Oa(a,e);var p=0;for(k=a.aoColumns.length;p<k;p++){var v=a.aoColumns[p];var n=(l=c?!1:!0)?w.createElement(v.sCellType):d[p];n._DT_CellIndex={row:b,column:p};g.push(n);if(l||
        !(c&&!v.mRender&&v.mData===p||f.isPlainObject(v.mData)&&v.mData._===p+".display"))n.innerHTML=F(a,b,p,"display");v.sClass&&(n.className+=" "+v.sClass);v.bVisible&&!c?m.appendChild(n):!v.bVisible&&c&&n.parentNode.removeChild(n);v.fnCreatedCell&&v.fnCreatedCell.call(a.oInstance,n,F(a,b,p),h,b,p)}A(a,"aoRowCreatedCallback",null,[m,h,b,g])}e.nTr.setAttribute("role","row")}function Oa(a,b){var c=b.nTr,d=b._aData;if(c){if(a=a.rowIdFn(d))c.id=a;d.DT_RowClass&&(a=d.DT_RowClass.split(" "),b.__rowc=b.__rowc?
        sa(b.__rowc.concat(a)):a,f(c).removeClass(b.__rowc.join(" ")).addClass(d.DT_RowClass));d.DT_RowAttr&&f(c).attr(d.DT_RowAttr);d.DT_RowData&&f(c).data(d.DT_RowData)}}function ob(a){var b,c,d=a.nTHead,e=a.nTFoot,h=0===f("th, td",d).length,g=a.oClasses,k=a.aoColumns;h&&(c=f("<tr/>").appendTo(d));var l=0;for(b=k.length;l<b;l++){var m=k[l];var p=f(m.nTh).addClass(m.sClass);h&&p.appendTo(c);a.oFeatures.bSort&&(p.addClass(m.sSortingClass),!1!==m.bSortable&&(p.attr("tabindex",a.iTabIndex).attr("aria-controls",
        a.sTableId),Pa(a,m.nTh,l)));m.sTitle!=p[0].innerHTML&&p.html(m.sTitle);Qa(a,"header")(a,p,m,g)}h&&ea(a.aoHeader,d);f(d).find(">tr").attr("role","row");f(d).find(">tr>th, >tr>td").addClass(g.sHeaderTH);f(e).find(">tr>th, >tr>td").addClass(g.sFooterTH);if(null!==e)for(a=a.aoFooter[0],l=0,b=a.length;l<b;l++)m=k[l],m.nTf=a[l].cell,m.sClass&&f(m.nTf).addClass(m.sClass)}function fa(a,b,c){var d,e,h=[],g=[],k=a.aoColumns.length;if(b){c===n&&(c=!1);var l=0;for(d=b.length;l<d;l++){h[l]=b[l].slice();h[l].nTr=
        b[l].nTr;for(e=k-1;0<=e;e--)a.aoColumns[e].bVisible||c||h[l].splice(e,1);g.push([])}l=0;for(d=h.length;l<d;l++){if(a=h[l].nTr)for(;e=a.firstChild;)a.removeChild(e);e=0;for(b=h[l].length;e<b;e++){var m=k=1;if(g[l][e]===n){a.appendChild(h[l][e].cell);for(g[l][e]=1;h[l+k]!==n&&h[l][e].cell==h[l+k][e].cell;)g[l+k][e]=1,k++;for(;h[l][e+m]!==n&&h[l][e].cell==h[l][e+m].cell;){for(c=0;c<k;c++)g[l+c][e+m]=1;m++}f(h[l][e].cell).attr("rowspan",k).attr("colspan",m)}}}}}function S(a){var b=A(a,"aoPreDrawCallback",
        "preDraw",[a]);if(-1!==f.inArray(!1,b))J(a,!1);else{b=[];var c=0,d=a.asStripeClasses,e=d.length,h=a.oLanguage,g=a.iInitDisplayStart,k="ssp"==I(a),l=a.aiDisplay;a.bDrawing=!0;g!==n&&-1!==g&&(a._iDisplayStart=k?g:g>=a.fnRecordsDisplay()?0:g,a.iInitDisplayStart=-1);g=a._iDisplayStart;var m=a.fnDisplayEnd();if(a.bDeferLoading)a.bDeferLoading=!1,a.iDraw++,J(a,!1);else if(!k)a.iDraw++;else if(!a.bDestroying&&!pb(a))return;if(0!==l.length)for(h=k?a.aoData.length:m,k=k?0:g;k<h;k++){var p=l[k],v=a.aoData[p];
        null===v.nTr&&Ka(a,p);var u=v.nTr;if(0!==e){var q=d[c%e];v._sRowStripe!=q&&(f(u).removeClass(v._sRowStripe).addClass(q),v._sRowStripe=q)}A(a,"aoRowCallback",null,[u,v._aData,c,k,p]);b.push(u);c++}else c=h.sZeroRecords,1==a.iDraw&&"ajax"==I(a)?c=h.sLoadingRecords:h.sEmptyTable&&0===a.fnRecordsTotal()&&(c=h.sEmptyTable),b[0]=f("<tr/>",{"class":e?d[0]:""}).append(f("<td />",{valign:"top",colSpan:V(a),"class":a.oClasses.sRowEmpty}).html(c))[0];A(a,"aoHeaderCallback","header",[f(a.nTHead).children("tr")[0],
        Na(a),g,m,l]);A(a,"aoFooterCallback","footer",[f(a.nTFoot).children("tr")[0],Na(a),g,m,l]);d=f(a.nTBody);d.children().detach();d.append(f(b));A(a,"aoDrawCallback","draw",[a]);a.bSorted=!1;a.bFiltered=!1;a.bDrawing=!1}}function U(a,b){var c=a.oFeatures,d=c.bFilter;c.bSort&&qb(a);d?ha(a,a.oPreviousSearch):a.aiDisplay=a.aiDisplayMaster.slice();!0!==b&&(a._iDisplayStart=0);a._drawHold=b;S(a);a._drawHold=!1}function rb(a){var b=a.oClasses,c=f(a.nTable);c=f("<div/>").insertBefore(c);var d=a.oFeatures,e=
        f("<div/>",{id:a.sTableId+"_wrapper","class":b.sWrapper+(a.nTFoot?"":" "+b.sNoFooter)});a.nHolding=c[0];a.nTableWrapper=e[0];a.nTableReinsertBefore=a.nTable.nextSibling;for(var h=a.sDom.split(""),g,k,l,m,p,n,u=0;u<h.length;u++){g=null;k=h[u];if("<"==k){l=f("<div/>")[0];m=h[u+1];if("'"==m||'"'==m){p="";for(n=2;h[u+n]!=m;)p+=h[u+n],n++;"H"==p?p=b.sJUIHeader:"F"==p&&(p=b.sJUIFooter);-1!=p.indexOf(".")?(m=p.split("."),l.id=m[0].substr(1,m[0].length-1),l.className=m[1]):"#"==p.charAt(0)?l.id=p.substr(1,
        p.length-1):l.className=p;u+=n}e.append(l);e=f(l)}else if(">"==k)e=e.parent();else if("l"==k&&d.bPaginate&&d.bLengthChange)g=sb(a);else if("f"==k&&d.bFilter)g=tb(a);else if("r"==k&&d.bProcessing)g=ub(a);else if("t"==k)g=vb(a);else if("i"==k&&d.bInfo)g=wb(a);else if("p"==k&&d.bPaginate)g=xb(a);else if(0!==q.ext.feature.length)for(l=q.ext.feature,n=0,m=l.length;n<m;n++)if(k==l[n].cFeature){g=l[n].fnInit(a);break}g&&(l=a.aanFeatures,l[k]||(l[k]=[]),l[k].push(g),e.append(g))}c.replaceWith(e);a.nHolding=
        null}function ea(a,b){b=f(b).children("tr");var c,d,e;a.splice(0,a.length);var h=0;for(e=b.length;h<e;h++)a.push([]);h=0;for(e=b.length;h<e;h++){var g=b[h];for(c=g.firstChild;c;){if("TD"==c.nodeName.toUpperCase()||"TH"==c.nodeName.toUpperCase()){var k=1*c.getAttribute("colspan");var l=1*c.getAttribute("rowspan");k=k&&0!==k&&1!==k?k:1;l=l&&0!==l&&1!==l?l:1;var m=0;for(d=a[h];d[m];)m++;var p=m;var n=1===k?!0:!1;for(d=0;d<k;d++)for(m=0;m<l;m++)a[h+m][p+d]={cell:c,unique:n},a[h+m].nTr=g}c=c.nextSibling}}}
    function ta(a,b,c){var d=[];c||(c=a.aoHeader,b&&(c=[],ea(c,b)));b=0;for(var e=c.length;b<e;b++)for(var h=0,g=c[b].length;h<g;h++)!c[b][h].unique||d[h]&&a.bSortCellsTop||(d[h]=c[b][h].cell);return d}function ua(a,b,c){A(a,"aoServerParams","serverParams",[b]);if(b&&f.isArray(b)){var d={},e=/(.*?)\[\]$/;f.each(b,function(a,b){(a=b.name.match(e))?(a=a[0],d[a]||(d[a]=[]),d[a].push(b.value)):d[b.name]=b.value});b=d}var h=a.ajax,g=a.oInstance,k=function(b){A(a,null,"xhr",[a,b,a.jqXHR]);c(b)};if(f.isPlainObject(h)&&
        h.data){var l=h.data;var m="function"===typeof l?l(b,a):l;b="function"===typeof l&&m?m:f.extend(!0,b,m);delete h.data}m={data:b,success:function(b){var c=b.error||b.sError;c&&O(a,0,c);a.json=b;k(b)},dataType:"json",cache:!1,type:a.sServerMethod,error:function(b,c,d){d=A(a,null,"xhr",[a,null,a.jqXHR]);-1===f.inArray(!0,d)&&("parsererror"==c?O(a,0,"Invalid JSON response",1):4===b.readyState&&O(a,0,"Ajax error",7));J(a,!1)}};a.oAjaxData=b;A(a,null,"preXhr",[a,b]);a.fnServerData?a.fnServerData.call(g,
        a.sAjaxSource,f.map(b,function(a,b){return{name:b,value:a}}),k,a):a.sAjaxSource||"string"===typeof h?a.jqXHR=f.ajax(f.extend(m,{url:h||a.sAjaxSource})):"function"===typeof h?a.jqXHR=h.call(g,b,k,a):(a.jqXHR=f.ajax(f.extend(m,h)),h.data=l)}function pb(a){return a.bAjaxDataGet?(a.iDraw++,J(a,!0),ua(a,yb(a),function(b){zb(a,b)}),!1):!0}function yb(a){var b=a.aoColumns,c=b.length,d=a.oFeatures,e=a.oPreviousSearch,h=a.aoPreSearchCols,g=[],k=X(a);var l=a._iDisplayStart;var m=!1!==d.bPaginate?a._iDisplayLength:
        -1;var p=function(a,b){g.push({name:a,value:b})};p("sEcho",a.iDraw);p("iColumns",c);p("sColumns",K(b,"sName").join(","));p("iDisplayStart",l);p("iDisplayLength",m);var n={draw:a.iDraw,columns:[],order:[],start:l,length:m,search:{value:e.sSearch,regex:e.bRegex}};for(l=0;l<c;l++){var u=b[l];var ra=h[l];m="function"==typeof u.mData?"function":u.mData;n.columns.push({data:m,name:u.sName,searchable:u.bSearchable,orderable:u.bSortable,search:{value:ra.sSearch,regex:ra.bRegex}});p("mDataProp_"+l,m);d.bFilter&&
    (p("sSearch_"+l,ra.sSearch),p("bRegex_"+l,ra.bRegex),p("bSearchable_"+l,u.bSearchable));d.bSort&&p("bSortable_"+l,u.bSortable)}d.bFilter&&(p("sSearch",e.sSearch),p("bRegex",e.bRegex));d.bSort&&(f.each(k,function(a,b){n.order.push({column:b.col,dir:b.dir});p("iSortCol_"+a,b.col);p("sSortDir_"+a,b.dir)}),p("iSortingCols",k.length));b=q.ext.legacy.ajax;return null===b?a.sAjaxSource?g:n:b?g:n}function zb(a,b){var c=function(a,c){return b[a]!==n?b[a]:b[c]},d=va(a,b),e=c("sEcho","draw"),h=c("iTotalRecords",
        "recordsTotal");c=c("iTotalDisplayRecords","recordsFiltered");if(e!==n){if(1*e<a.iDraw)return;a.iDraw=1*e}pa(a);a._iRecordsTotal=parseInt(h,10);a._iRecordsDisplay=parseInt(c,10);e=0;for(h=d.length;e<h;e++)R(a,d[e]);a.aiDisplay=a.aiDisplayMaster.slice();a.bAjaxDataGet=!1;S(a);a._bInitComplete||wa(a,b);a.bAjaxDataGet=!0;J(a,!1)}function va(a,b){a=f.isPlainObject(a.ajax)&&a.ajax.dataSrc!==n?a.ajax.dataSrc:a.sAjaxDataProp;return"data"===a?b.aaData||b[a]:""!==a?T(a)(b):b}function tb(a){var b=a.oClasses,
        c=a.sTableId,d=a.oLanguage,e=a.oPreviousSearch,h=a.aanFeatures,g='<input type="search" class="'+b.sFilterInput+'"/>',k=d.sSearch;k=k.match(/_INPUT_/)?k.replace("_INPUT_",g):k+g;b=f("<div/>",{id:h.f?null:c+"_filter","class":b.sFilter}).append(f("<label/>").append(k));var l=function(){var b=this.value?this.value:"";b!=e.sSearch&&(ha(a,{sSearch:b,bRegex:e.bRegex,bSmart:e.bSmart,bCaseInsensitive:e.bCaseInsensitive}),a._iDisplayStart=0,S(a))};h=null!==a.searchDelay?a.searchDelay:"ssp"===I(a)?400:0;var m=
        f("input",b).val(e.sSearch).attr("placeholder",d.sSearchPlaceholder).on("keyup.DT search.DT input.DT paste.DT cut.DT",h?Ra(l,h):l).on("mouseup",function(a){setTimeout(function(){l.call(m[0])},10)}).on("keypress.DT",function(a){if(13==a.keyCode)return!1}).attr("aria-controls",c);f(a.nTable).on("search.dt.DT",function(b,c){if(a===c)try{m[0]!==w.activeElement&&m.val(e.sSearch)}catch(u){}});return b[0]}function ha(a,b,c){var d=a.oPreviousSearch,e=a.aoPreSearchCols,h=function(a){d.sSearch=a.sSearch;d.bRegex=
        a.bRegex;d.bSmart=a.bSmart;d.bCaseInsensitive=a.bCaseInsensitive},g=function(a){return a.bEscapeRegex!==n?!a.bEscapeRegex:a.bRegex};Ja(a);if("ssp"!=I(a)){Ab(a,b.sSearch,c,g(b),b.bSmart,b.bCaseInsensitive);h(b);for(b=0;b<e.length;b++)Bb(a,e[b].sSearch,b,g(e[b]),e[b].bSmart,e[b].bCaseInsensitive);Cb(a)}else h(b);a.bFiltered=!0;A(a,null,"search",[a])}function Cb(a){for(var b=q.ext.search,c=a.aiDisplay,d,e,h=0,g=b.length;h<g;h++){for(var k=[],l=0,m=c.length;l<m;l++)e=c[l],d=a.aoData[e],b[h](a,d._aFilterData,
        e,d._aData,l)&&k.push(e);c.length=0;f.merge(c,k)}}function Bb(a,b,c,d,e,h){if(""!==b){var g=[],k=a.aiDisplay;d=Sa(b,d,e,h);for(e=0;e<k.length;e++)b=a.aoData[k[e]]._aFilterData[c],d.test(b)&&g.push(k[e]);a.aiDisplay=g}}function Ab(a,b,c,d,e,h){e=Sa(b,d,e,h);var g=a.oPreviousSearch.sSearch,k=a.aiDisplayMaster;h=[];0!==q.ext.search.length&&(c=!0);var f=Db(a);if(0>=b.length)a.aiDisplay=k.slice();else{if(f||c||d||g.length>b.length||0!==b.indexOf(g)||a.bSorted)a.aiDisplay=k.slice();b=a.aiDisplay;for(c=
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               0;c<b.length;c++)e.test(a.aoData[b[c]]._sFilterRow)&&h.push(b[c]);a.aiDisplay=h}}function Sa(a,b,c,d){a=b?a:Ta(a);c&&(a="^(?=.*?"+f.map(a.match(/"[^"]+"|[^ ]+/g)||[""],function(a){if('"'===a.charAt(0)){var b=a.match(/^"(.*)"$/);a=b?b[1]:a}return a.replace('"',"")}).join(")(?=.*?")+").*$");return new RegExp(a,d?"i":"")}function Db(a){var b=a.aoColumns,c,d,e=q.ext.type.search;var h=!1;var g=0;for(c=a.aoData.length;g<c;g++){var k=a.aoData[g];if(!k._aFilterData){var f=[];var m=0;for(d=b.length;m<d;m++){h=
        b[m];if(h.bSearchable){var p=F(a,g,m,"filter");e[h.sType]&&(p=e[h.sType](p));null===p&&(p="");"string"!==typeof p&&p.toString&&(p=p.toString())}else p="";p.indexOf&&-1!==p.indexOf("&")&&(xa.innerHTML=p,p=$b?xa.textContent:xa.innerText);p.replace&&(p=p.replace(/[\r\n\u2028]/g,""));f.push(p)}k._aFilterData=f;k._sFilterRow=f.join("  ");h=!0}}return h}function Eb(a){return{search:a.sSearch,smart:a.bSmart,regex:a.bRegex,caseInsensitive:a.bCaseInsensitive}}function Fb(a){return{sSearch:a.search,bSmart:a.smart,
        bRegex:a.regex,bCaseInsensitive:a.caseInsensitive}}function wb(a){var b=a.sTableId,c=a.aanFeatures.i,d=f("<div/>",{"class":a.oClasses.sInfo,id:c?null:b+"_info"});c||(a.aoDrawCallback.push({fn:Gb,sName:"information"}),d.attr("role","status").attr("aria-live","polite"),f(a.nTable).attr("aria-describedby",b+"_info"));return d[0]}function Gb(a){var b=a.aanFeatures.i;if(0!==b.length){var c=a.oLanguage,d=a._iDisplayStart+1,e=a.fnDisplayEnd(),h=a.fnRecordsTotal(),g=a.fnRecordsDisplay(),k=g?c.sInfo:c.sInfoEmpty;
        g!==h&&(k+=" "+c.sInfoFiltered);k+=c.sInfoPostFix;k=Hb(a,k);c=c.fnInfoCallback;null!==c&&(k=c.call(a.oInstance,a,d,e,h,g,k));f(b).html(k)}}function Hb(a,b){var c=a.fnFormatNumber,d=a._iDisplayStart+1,e=a._iDisplayLength,h=a.fnRecordsDisplay(),g=-1===e;return b.replace(/_START_/g,c.call(a,d)).replace(/_END_/g,c.call(a,a.fnDisplayEnd())).replace(/_MAX_/g,c.call(a,a.fnRecordsTotal())).replace(/_TOTAL_/g,c.call(a,h)).replace(/_PAGE_/g,c.call(a,g?1:Math.ceil(d/e))).replace(/_PAGES_/g,c.call(a,g?1:Math.ceil(h/
        e)))}function ia(a){var b=a.iInitDisplayStart,c=a.aoColumns;var d=a.oFeatures;var e=a.bDeferLoading;if(a.bInitialised){rb(a);ob(a);fa(a,a.aoHeader);fa(a,a.aoFooter);J(a,!0);d.bAutoWidth&&Ia(a);var h=0;for(d=c.length;h<d;h++){var g=c[h];g.sWidth&&(g.nTh.style.width=B(g.sWidth))}A(a,null,"preInit",[a]);U(a);c=I(a);if("ssp"!=c||e)"ajax"==c?ua(a,[],function(c){var d=va(a,c);for(h=0;h<d.length;h++)R(a,d[h]);a.iInitDisplayStart=b;U(a);J(a,!1);wa(a,c)},a):(J(a,!1),wa(a))}else setTimeout(function(){ia(a)},
        200)}function wa(a,b){a._bInitComplete=!0;(b||a.oInit.aaData)&&Z(a);A(a,null,"plugin-init",[a,b]);A(a,"aoInitComplete","init",[a,b])}function Ua(a,b){b=parseInt(b,10);a._iDisplayLength=b;Va(a);A(a,null,"length",[a,b])}function sb(a){var b=a.oClasses,c=a.sTableId,d=a.aLengthMenu,e=f.isArray(d[0]),h=e?d[0]:d;d=e?d[1]:d;e=f("<select/>",{name:c+"_length","aria-controls":c,"class":b.sLengthSelect});for(var g=0,k=h.length;g<k;g++)e[0][g]=new Option("number"===typeof d[g]?a.fnFormatNumber(d[g]):d[g],h[g]);
        var l=f("<div><label/></div>").addClass(b.sLength);a.aanFeatures.l||(l[0].id=c+"_length");l.children().append(a.oLanguage.sLengthMenu.replace("_MENU_",e[0].outerHTML));f("select",l).val(a._iDisplayLength).on("change.DT",function(b){Ua(a,f(this).val());S(a)});f(a.nTable).on("length.dt.DT",function(b,c,d){a===c&&f("select",l).val(d)});return l[0]}function xb(a){var b=a.sPaginationType,c=q.ext.pager[b],d="function"===typeof c,e=function(a){S(a)};b=f("<div/>").addClass(a.oClasses.sPaging+b)[0];var h=
        a.aanFeatures;d||c.fnInit(a,b,e);h.p||(b.id=a.sTableId+"_paginate",a.aoDrawCallback.push({fn:function(a){if(d){var b=a._iDisplayStart,g=a._iDisplayLength,f=a.fnRecordsDisplay(),p=-1===g;b=p?0:Math.ceil(b/g);g=p?1:Math.ceil(f/g);f=c(b,g);var n;p=0;for(n=h.p.length;p<n;p++)Qa(a,"pageButton")(a,h.p[p],p,f,b,g)}else c.fnUpdate(a,e)},sName:"pagination"}));return b}function Wa(a,b,c){var d=a._iDisplayStart,e=a._iDisplayLength,h=a.fnRecordsDisplay();0===h||-1===e?d=0:"number"===typeof b?(d=b*e,d>h&&(d=0)):
        "first"==b?d=0:"previous"==b?(d=0<=e?d-e:0,0>d&&(d=0)):"next"==b?d+e<h&&(d+=e):"last"==b?d=Math.floor((h-1)/e)*e:O(a,0,"Unknown paging action: "+b,5);b=a._iDisplayStart!==d;a._iDisplayStart=d;b&&(A(a,null,"page",[a]),c&&S(a));return b}function ub(a){return f("<div/>",{id:a.aanFeatures.r?null:a.sTableId+"_processing","class":a.oClasses.sProcessing}).html(a.oLanguage.sProcessing).insertBefore(a.nTable)[0]}function J(a,b){a.oFeatures.bProcessing&&f(a.aanFeatures.r).css("display",b?"block":"none");A(a,
        null,"processing",[a,b])}function vb(a){var b=f(a.nTable);b.attr("role","grid");var c=a.oScroll;if(""===c.sX&&""===c.sY)return a.nTable;var d=c.sX,e=c.sY,h=a.oClasses,g=b.children("caption"),k=g.length?g[0]._captionSide:null,l=f(b[0].cloneNode(!1)),m=f(b[0].cloneNode(!1)),p=b.children("tfoot");p.length||(p=null);l=f("<div/>",{"class":h.sScrollWrapper}).append(f("<div/>",{"class":h.sScrollHead}).css({overflow:"hidden",position:"relative",border:0,width:d?d?B(d):null:"100%"}).append(f("<div/>",{"class":h.sScrollHeadInner}).css({"box-sizing":"content-box",
        width:c.sXInner||"100%"}).append(l.removeAttr("id").css("margin-left",0).append("top"===k?g:null).append(b.children("thead"))))).append(f("<div/>",{"class":h.sScrollBody}).css({position:"relative",overflow:"auto",width:d?B(d):null}).append(b));p&&l.append(f("<div/>",{"class":h.sScrollFoot}).css({overflow:"hidden",border:0,width:d?d?B(d):null:"100%"}).append(f("<div/>",{"class":h.sScrollFootInner}).append(m.removeAttr("id").css("margin-left",0).append("bottom"===k?g:null).append(b.children("tfoot")))));
        b=l.children();var n=b[0];h=b[1];var u=p?b[2]:null;if(d)f(h).on("scroll.DT",function(a){a=this.scrollLeft;n.scrollLeft=a;p&&(u.scrollLeft=a)});f(h).css("max-height",e);c.bCollapse||f(h).css("height",e);a.nScrollHead=n;a.nScrollBody=h;a.nScrollFoot=u;a.aoDrawCallback.push({fn:ma,sName:"scrolling"});return l[0]}function ma(a){var b=a.oScroll,c=b.sX,d=b.sXInner,e=b.sY;b=b.iBarWidth;var h=f(a.nScrollHead),g=h[0].style,k=h.children("div"),l=k[0].style,m=k.children("table");k=a.nScrollBody;var p=f(k),v=
        k.style,u=f(a.nScrollFoot).children("div"),q=u.children("table"),t=f(a.nTHead),r=f(a.nTable),x=r[0],ya=x.style,w=a.nTFoot?f(a.nTFoot):null,y=a.oBrowser,A=y.bScrollOversize,ac=K(a.aoColumns,"nTh"),Xa=[],z=[],C=[],G=[],H,I=function(a){a=a.style;a.paddingTop="0";a.paddingBottom="0";a.borderTopWidth="0";a.borderBottomWidth="0";a.height=0};var D=k.scrollHeight>k.clientHeight;if(a.scrollBarVis!==D&&a.scrollBarVis!==n)a.scrollBarVis=D,Z(a);else{a.scrollBarVis=D;r.children("thead, tfoot").remove();if(w){var E=
        w.clone().prependTo(r);var F=w.find("tr");E=E.find("tr")}var J=t.clone().prependTo(r);t=t.find("tr");D=J.find("tr");J.find("th, td").removeAttr("tabindex");c||(v.width="100%",h[0].style.width="100%");f.each(ta(a,J),function(b,c){H=aa(a,b);c.style.width=a.aoColumns[H].sWidth});w&&N(function(a){a.style.width=""},E);h=r.outerWidth();""===c?(ya.width="100%",A&&(r.find("tbody").height()>k.offsetHeight||"scroll"==p.css("overflow-y"))&&(ya.width=B(r.outerWidth()-b)),h=r.outerWidth()):""!==d&&(ya.width=B(d),
        h=r.outerWidth());N(I,D);N(function(a){C.push(a.innerHTML);Xa.push(B(f(a).css("width")))},D);N(function(a,b){-1!==f.inArray(a,ac)&&(a.style.width=Xa[b])},t);f(D).height(0);w&&(N(I,E),N(function(a){G.push(a.innerHTML);z.push(B(f(a).css("width")))},E),N(function(a,b){a.style.width=z[b]},F),f(E).height(0));N(function(a,b){a.innerHTML='<div class="dataTables_sizing">'+C[b]+"</div>";a.childNodes[0].style.height="0";a.childNodes[0].style.overflow="hidden";a.style.width=Xa[b]},D);w&&N(function(a,b){a.innerHTML=
        '<div class="dataTables_sizing">'+G[b]+"</div>";a.childNodes[0].style.height="0";a.childNodes[0].style.overflow="hidden";a.style.width=z[b]},E);r.outerWidth()<h?(F=k.scrollHeight>k.offsetHeight||"scroll"==p.css("overflow-y")?h+b:h,A&&(k.scrollHeight>k.offsetHeight||"scroll"==p.css("overflow-y"))&&(ya.width=B(F-b)),""!==c&&""===d||O(a,1,"Possible column misalignment",6)):F="100%";v.width=B(F);g.width=B(F);w&&(a.nScrollFoot.style.width=B(F));!e&&A&&(v.height=B(x.offsetHeight+b));c=r.outerWidth();m[0].style.width=
        B(c);l.width=B(c);d=r.height()>k.clientHeight||"scroll"==p.css("overflow-y");e="padding"+(y.bScrollbarLeft?"Left":"Right");l[e]=d?b+"px":"0px";w&&(q[0].style.width=B(c),u[0].style.width=B(c),u[0].style[e]=d?b+"px":"0px");r.children("colgroup").insertBefore(r.children("thead"));p.trigger("scroll");!a.bSorted&&!a.bFiltered||a._drawHold||(k.scrollTop=0)}}function N(a,b,c){for(var d=0,e=0,h=b.length,g,k;e<h;){g=b[e].firstChild;for(k=c?c[e].firstChild:null;g;)1===g.nodeType&&(c?a(g,k,d):a(g,d),d++),g=
        g.nextSibling,k=c?k.nextSibling:null;e++}}function Ia(a){var b=a.nTable,c=a.aoColumns,d=a.oScroll,e=d.sY,h=d.sX,g=d.sXInner,k=c.length,l=na(a,"bVisible"),m=f("th",a.nTHead),p=b.getAttribute("width"),n=b.parentNode,u=!1,q,t=a.oBrowser;d=t.bScrollOversize;(q=b.style.width)&&-1!==q.indexOf("%")&&(p=q);for(q=0;q<l.length;q++){var r=c[l[q]];null!==r.sWidth&&(r.sWidth=Ib(r.sWidthOrig,n),u=!0)}if(d||!u&&!h&&!e&&k==V(a)&&k==m.length)for(q=0;q<k;q++)l=aa(a,q),null!==l&&(c[l].sWidth=B(m.eq(q).width()));else{k=
        f(b).clone().css("visibility","hidden").removeAttr("id");k.find("tbody tr").remove();var w=f("<tr/>").appendTo(k.find("tbody"));k.find("thead, tfoot").remove();k.append(f(a.nTHead).clone()).append(f(a.nTFoot).clone());k.find("tfoot th, tfoot td").css("width","");m=ta(a,k.find("thead")[0]);for(q=0;q<l.length;q++)r=c[l[q]],m[q].style.width=null!==r.sWidthOrig&&""!==r.sWidthOrig?B(r.sWidthOrig):"",r.sWidthOrig&&h&&f(m[q]).append(f("<div/>").css({width:r.sWidthOrig,margin:0,padding:0,border:0,height:1}));
        if(a.aoData.length)for(q=0;q<l.length;q++)u=l[q],r=c[u],f(Jb(a,u)).clone(!1).append(r.sContentPadding).appendTo(w);f("[name]",k).removeAttr("name");r=f("<div/>").css(h||e?{position:"absolute",top:0,left:0,height:1,right:0,overflow:"hidden"}:{}).append(k).appendTo(n);h&&g?k.width(g):h?(k.css("width","auto"),k.removeAttr("width"),k.width()<n.clientWidth&&p&&k.width(n.clientWidth)):e?k.width(n.clientWidth):p&&k.width(p);for(q=e=0;q<l.length;q++)n=f(m[q]),g=n.outerWidth()-n.width(),n=t.bBounding?Math.ceil(m[q].getBoundingClientRect().width):
            n.outerWidth(),e+=n,c[l[q]].sWidth=B(n-g);b.style.width=B(e);r.remove()}p&&(b.style.width=B(p));!p&&!h||a._reszEvt||(b=function(){f(y).on("resize.DT-"+a.sInstance,Ra(function(){Z(a)}))},d?setTimeout(b,1E3):b(),a._reszEvt=!0)}function Ib(a,b){if(!a)return 0;a=f("<div/>").css("width",B(a)).appendTo(b||w.body);b=a[0].offsetWidth;a.remove();return b}function Jb(a,b){var c=Kb(a,b);if(0>c)return null;var d=a.aoData[c];return d.nTr?d.anCells[b]:f("<td/>").html(F(a,c,b,"display"))[0]}function Kb(a,b){for(var c,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      d=-1,e=-1,h=0,g=a.aoData.length;h<g;h++)c=F(a,h,b,"display")+"",c=c.replace(bc,""),c=c.replace(/&nbsp;/g," "),c.length>d&&(d=c.length,e=h);return e}function B(a){return null===a?"0px":"number"==typeof a?0>a?"0px":a+"px":a.match(/\d$/)?a+"px":a}function X(a){var b=[],c=a.aoColumns;var d=a.aaSortingFixed;var e=f.isPlainObject(d);var h=[];var g=function(a){a.length&&!f.isArray(a[0])?h.push(a):f.merge(h,a)};f.isArray(d)&&g(d);e&&d.pre&&g(d.pre);g(a.aaSorting);e&&d.post&&g(d.post);for(a=0;a<h.length;a++){var k=
        h[a][0];g=c[k].aDataSort;d=0;for(e=g.length;d<e;d++){var l=g[d];var m=c[l].sType||"string";h[a]._idx===n&&(h[a]._idx=f.inArray(h[a][1],c[l].asSorting));b.push({src:k,col:l,dir:h[a][1],index:h[a]._idx,type:m,formatter:q.ext.type.order[m+"-pre"]})}}return b}function qb(a){var b,c=[],d=q.ext.type.order,e=a.aoData,h=0,g=a.aiDisplayMaster;Ja(a);var k=X(a);var f=0;for(b=k.length;f<b;f++){var m=k[f];m.formatter&&h++;Lb(a,m.col)}if("ssp"!=I(a)&&0!==k.length){f=0;for(b=g.length;f<b;f++)c[g[f]]=f;h===k.length?
        g.sort(function(a,b){var d,h=k.length,g=e[a]._aSortData,f=e[b]._aSortData;for(d=0;d<h;d++){var l=k[d];var m=g[l.col];var p=f[l.col];m=m<p?-1:m>p?1:0;if(0!==m)return"asc"===l.dir?m:-m}m=c[a];p=c[b];return m<p?-1:m>p?1:0}):g.sort(function(a,b){var h,g=k.length,f=e[a]._aSortData,l=e[b]._aSortData;for(h=0;h<g;h++){var m=k[h];var p=f[m.col];var n=l[m.col];m=d[m.type+"-"+m.dir]||d["string-"+m.dir];p=m(p,n);if(0!==p)return p}p=c[a];n=c[b];return p<n?-1:p>n?1:0})}a.bSorted=!0}function Mb(a){var b=a.aoColumns,
        c=X(a);a=a.oLanguage.oAria;for(var d=0,e=b.length;d<e;d++){var h=b[d];var g=h.asSorting;var k=h.sTitle.replace(/<.*?>/g,"");var f=h.nTh;f.removeAttribute("aria-sort");h.bSortable&&(0<c.length&&c[0].col==d?(f.setAttribute("aria-sort","asc"==c[0].dir?"ascending":"descending"),h=g[c[0].index+1]||g[0]):h=g[0],k+="asc"===h?a.sSortAscending:a.sSortDescending);f.setAttribute("aria-label",k)}}function Ya(a,b,c,d){var e=a.aaSorting,h=a.aoColumns[b].asSorting,g=function(a,b){var c=a._idx;c===n&&(c=f.inArray(a[1],
        h));return c+1<h.length?c+1:b?null:0};"number"===typeof e[0]&&(e=a.aaSorting=[e]);c&&a.oFeatures.bSortMulti?(c=f.inArray(b,K(e,"0")),-1!==c?(b=g(e[c],!0),null===b&&1===e.length&&(b=0),null===b?e.splice(c,1):(e[c][1]=h[b],e[c]._idx=b)):(e.push([b,h[0],0]),e[e.length-1]._idx=0)):e.length&&e[0][0]==b?(b=g(e[0]),e.length=1,e[0][1]=h[b],e[0]._idx=b):(e.length=0,e.push([b,h[0]]),e[0]._idx=0);U(a);"function"==typeof d&&d(a)}function Pa(a,b,c,d){var e=a.aoColumns[c];Za(b,{},function(b){!1!==e.bSortable&&
    (a.oFeatures.bProcessing?(J(a,!0),setTimeout(function(){Ya(a,c,b.shiftKey,d);"ssp"!==I(a)&&J(a,!1)},0)):Ya(a,c,b.shiftKey,d))})}function za(a){var b=a.aLastSort,c=a.oClasses.sSortColumn,d=X(a),e=a.oFeatures,h;if(e.bSort&&e.bSortClasses){e=0;for(h=b.length;e<h;e++){var g=b[e].src;f(K(a.aoData,"anCells",g)).removeClass(c+(2>e?e+1:3))}e=0;for(h=d.length;e<h;e++)g=d[e].src,f(K(a.aoData,"anCells",g)).addClass(c+(2>e?e+1:3))}a.aLastSort=d}function Lb(a,b){var c=a.aoColumns[b],d=q.ext.order[c.sSortDataType],
        e;d&&(e=d.call(a.oInstance,a,b,ba(a,b)));for(var h,g=q.ext.type.order[c.sType+"-pre"],f=0,l=a.aoData.length;f<l;f++)if(c=a.aoData[f],c._aSortData||(c._aSortData=[]),!c._aSortData[b]||d)h=d?e[f]:F(a,f,b,"sort"),c._aSortData[b]=g?g(h):h}function Aa(a){if(a.oFeatures.bStateSave&&!a.bDestroying){var b={time:+new Date,start:a._iDisplayStart,length:a._iDisplayLength,order:f.extend(!0,[],a.aaSorting),search:Eb(a.oPreviousSearch),columns:f.map(a.aoColumns,function(b,d){return{visible:b.bVisible,search:Eb(a.aoPreSearchCols[d])}})};
        A(a,"aoStateSaveParams","stateSaveParams",[a,b]);a.oSavedState=b;a.fnStateSaveCallback.call(a.oInstance,a,b)}}function Nb(a,b,c){var d,e,h=a.aoColumns;b=function(b){if(b&&b.time){var g=A(a,"aoStateLoadParams","stateLoadParams",[a,b]);if(-1===f.inArray(!1,g)&&(g=a.iStateDuration,!(0<g&&b.time<+new Date-1E3*g||b.columns&&h.length!==b.columns.length))){a.oLoadedState=f.extend(!0,{},b);b.start!==n&&(a._iDisplayStart=b.start,a.iInitDisplayStart=b.start);b.length!==n&&(a._iDisplayLength=b.length);b.order!==
    n&&(a.aaSorting=[],f.each(b.order,function(b,c){a.aaSorting.push(c[0]>=h.length?[0,c[1]]:c)}));b.search!==n&&f.extend(a.oPreviousSearch,Fb(b.search));if(b.columns)for(d=0,e=b.columns.length;d<e;d++)g=b.columns[d],g.visible!==n&&(h[d].bVisible=g.visible),g.search!==n&&f.extend(a.aoPreSearchCols[d],Fb(g.search));A(a,"aoStateLoaded","stateLoaded",[a,b])}}c()};if(a.oFeatures.bStateSave){var g=a.fnStateLoadCallback.call(a.oInstance,a,b);g!==n&&b(g)}else c()}function Ba(a){var b=q.settings;a=f.inArray(a,
        K(b,"nTable"));return-1!==a?b[a]:null}function O(a,b,c,d){c="DataTables warning: "+(a?"table id="+a.sTableId+" - ":"")+c;d&&(c+=". For more information about this error, please see http://datatables.net/tn/"+d);if(b)y.console&&console.log&&console.log(c);else if(b=q.ext,b=b.sErrMode||b.errMode,a&&A(a,null,"error",[a,d,c]),"alert"==b)alert(c);else{if("throw"==b)throw Error(c);"function"==typeof b&&b(a,d,c)}}function M(a,b,c,d){f.isArray(c)?f.each(c,function(c,d){f.isArray(d)?M(a,b,d[0],d[1]):M(a,b,
        d)}):(d===n&&(d=c),b[c]!==n&&(a[d]=b[c]))}function $a(a,b,c){var d;for(d in b)if(b.hasOwnProperty(d)){var e=b[d];f.isPlainObject(e)?(f.isPlainObject(a[d])||(a[d]={}),f.extend(!0,a[d],e)):c&&"data"!==d&&"aaData"!==d&&f.isArray(e)?a[d]=e.slice():a[d]=e}return a}function Za(a,b,c){f(a).on("click.DT",b,function(b){f(a).trigger("blur");c(b)}).on("keypress.DT",b,function(a){13===a.which&&(a.preventDefault(),c(a))}).on("selectstart.DT",function(){return!1})}function D(a,b,c,d){c&&a[b].push({fn:c,sName:d})}
    function A(a,b,c,d){var e=[];b&&(e=f.map(a[b].slice().reverse(),function(b,c){return b.fn.apply(a.oInstance,d)}));null!==c&&(b=f.Event(c+".dt"),f(a.nTable).trigger(b,d),e.push(b.result));return e}function Va(a){var b=a._iDisplayStart,c=a.fnDisplayEnd(),d=a._iDisplayLength;b>=c&&(b=c-d);b-=b%d;if(-1===d||0>b)b=0;a._iDisplayStart=b}function Qa(a,b){a=a.renderer;var c=q.ext.renderer[b];return f.isPlainObject(a)&&a[b]?c[a[b]]||c._:"string"===typeof a?c[a]||c._:c._}function I(a){return a.oFeatures.bServerSide?
        "ssp":a.ajax||a.sAjaxSource?"ajax":"dom"}function ja(a,b){var c=Ob.numbers_length,d=Math.floor(c/2);b<=c?a=Y(0,b):a<=d?(a=Y(0,c-2),a.push("ellipsis"),a.push(b-1)):(a>=b-1-d?a=Y(b-(c-2),b):(a=Y(a-d+2,a+d-1),a.push("ellipsis"),a.push(b-1)),a.splice(0,0,"ellipsis"),a.splice(0,0,0));a.DT_el="span";return a}function Ga(a){f.each({num:function(b){return Ca(b,a)},"num-fmt":function(b){return Ca(b,a,ab)},"html-num":function(b){return Ca(b,a,Da)},"html-num-fmt":function(b){return Ca(b,a,Da,ab)}},function(b,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             c){C.type.order[b+a+"-pre"]=c;b.match(/^html\-/)&&(C.type.search[b+a]=C.type.search.html)})}function Pb(a){return function(){var b=[Ba(this[q.ext.iApiIndex])].concat(Array.prototype.slice.call(arguments));return q.ext.internal[a].apply(this,b)}}var q=function(a){this.$=function(a,b){return this.api(!0).$(a,b)};this._=function(a,b){return this.api(!0).rows(a,b).data()};this.api=function(a){return a?new x(Ba(this[C.iApiIndex])):new x(this)};this.fnAddData=function(a,b){var c=this.api(!0);a=f.isArray(a)&&
    (f.isArray(a[0])||f.isPlainObject(a[0]))?c.rows.add(a):c.row.add(a);(b===n||b)&&c.draw();return a.flatten().toArray()};this.fnAdjustColumnSizing=function(a){var b=this.api(!0).columns.adjust(),c=b.settings()[0],d=c.oScroll;a===n||a?b.draw(!1):(""!==d.sX||""!==d.sY)&&ma(c)};this.fnClearTable=function(a){var b=this.api(!0).clear();(a===n||a)&&b.draw()};this.fnClose=function(a){this.api(!0).row(a).child.hide()};this.fnDeleteRow=function(a,b,c){var d=this.api(!0);a=d.rows(a);var e=a.settings()[0],h=e.aoData[a[0][0]];
        a.remove();b&&b.call(this,e,h);(c===n||c)&&d.draw();return h};this.fnDestroy=function(a){this.api(!0).destroy(a)};this.fnDraw=function(a){this.api(!0).draw(a)};this.fnFilter=function(a,b,c,d,e,f){e=this.api(!0);null===b||b===n?e.search(a,c,d,f):e.column(b).search(a,c,d,f);e.draw()};this.fnGetData=function(a,b){var c=this.api(!0);if(a!==n){var d=a.nodeName?a.nodeName.toLowerCase():"";return b!==n||"td"==d||"th"==d?c.cell(a,b).data():c.row(a).data()||null}return c.data().toArray()};this.fnGetNodes=
        function(a){var b=this.api(!0);return a!==n?b.row(a).node():b.rows().nodes().flatten().toArray()};this.fnGetPosition=function(a){var b=this.api(!0),c=a.nodeName.toUpperCase();return"TR"==c?b.row(a).index():"TD"==c||"TH"==c?(a=b.cell(a).index(),[a.row,a.columnVisible,a.column]):null};this.fnIsOpen=function(a){return this.api(!0).row(a).child.isShown()};this.fnOpen=function(a,b,c){return this.api(!0).row(a).child(b,c).show().child()[0]};this.fnPageChange=function(a,b){a=this.api(!0).page(a);(b===n||
        b)&&a.draw(!1)};this.fnSetColumnVis=function(a,b,c){a=this.api(!0).column(a).visible(b);(c===n||c)&&a.columns.adjust().draw()};this.fnSettings=function(){return Ba(this[C.iApiIndex])};this.fnSort=function(a){this.api(!0).order(a).draw()};this.fnSortListener=function(a,b,c){this.api(!0).order.listener(a,b,c)};this.fnUpdate=function(a,b,c,d,e){var h=this.api(!0);c===n||null===c?h.row(b).data(a):h.cell(b,c).data(a);(e===n||e)&&h.columns.adjust();(d===n||d)&&h.draw();return 0};this.fnVersionCheck=C.fnVersionCheck;
        var b=this,c=a===n,d=this.length;c&&(a={});this.oApi=this.internal=C.internal;for(var e in q.ext.internal)e&&(this[e]=Pb(e));this.each(function(){var e={},g=1<d?$a(e,a,!0):a,k=0,l;e=this.getAttribute("id");var m=!1,p=q.defaults,v=f(this);if("table"!=this.nodeName.toLowerCase())O(null,0,"Non-table node initialisation ("+this.nodeName+")",2);else{ib(p);jb(p.column);L(p,p,!0);L(p.column,p.column,!0);L(p,f.extend(g,v.data()),!0);var u=q.settings;k=0;for(l=u.length;k<l;k++){var t=u[k];if(t.nTable==this||
            t.nTHead&&t.nTHead.parentNode==this||t.nTFoot&&t.nTFoot.parentNode==this){var w=g.bRetrieve!==n?g.bRetrieve:p.bRetrieve;if(c||w)return t.oInstance;if(g.bDestroy!==n?g.bDestroy:p.bDestroy){t.oInstance.fnDestroy();break}else{O(t,0,"Cannot reinitialise DataTable",3);return}}if(t.sTableId==this.id){u.splice(k,1);break}}if(null===e||""===e)this.id=e="DataTables_Table_"+q.ext._unique++;var r=f.extend(!0,{},q.models.oSettings,{sDestroyWidth:v[0].style.width,sInstance:e,sTableId:e});r.nTable=this;r.oApi=
            b.internal;r.oInit=g;u.push(r);r.oInstance=1===b.length?b:v.dataTable();ib(g);Fa(g.oLanguage);g.aLengthMenu&&!g.iDisplayLength&&(g.iDisplayLength=f.isArray(g.aLengthMenu[0])?g.aLengthMenu[0][0]:g.aLengthMenu[0]);g=$a(f.extend(!0,{},p),g);M(r.oFeatures,g,"bPaginate bLengthChange bFilter bSort bSortMulti bInfo bProcessing bAutoWidth bSortClasses bServerSide bDeferRender".split(" "));M(r,g,["asStripeClasses","ajax","fnServerData","fnFormatNumber","sServerMethod","aaSorting","aaSortingFixed","aLengthMenu",
            "sPaginationType","sAjaxSource","sAjaxDataProp","iStateDuration","sDom","bSortCellsTop","iTabIndex","fnStateLoadCallback","fnStateSaveCallback","renderer","searchDelay","rowId",["iCookieDuration","iStateDuration"],["oSearch","oPreviousSearch"],["aoSearchCols","aoPreSearchCols"],["iDisplayLength","_iDisplayLength"]]);M(r.oScroll,g,[["sScrollX","sX"],["sScrollXInner","sXInner"],["sScrollY","sY"],["bScrollCollapse","bCollapse"]]);M(r.oLanguage,g,"fnInfoCallback");D(r,"aoDrawCallback",g.fnDrawCallback,
            "user");D(r,"aoServerParams",g.fnServerParams,"user");D(r,"aoStateSaveParams",g.fnStateSaveParams,"user");D(r,"aoStateLoadParams",g.fnStateLoadParams,"user");D(r,"aoStateLoaded",g.fnStateLoaded,"user");D(r,"aoRowCallback",g.fnRowCallback,"user");D(r,"aoRowCreatedCallback",g.fnCreatedRow,"user");D(r,"aoHeaderCallback",g.fnHeaderCallback,"user");D(r,"aoFooterCallback",g.fnFooterCallback,"user");D(r,"aoInitComplete",g.fnInitComplete,"user");D(r,"aoPreDrawCallback",g.fnPreDrawCallback,"user");r.rowIdFn=
            T(g.rowId);kb(r);var x=r.oClasses;f.extend(x,q.ext.classes,g.oClasses);v.addClass(x.sTable);r.iInitDisplayStart===n&&(r.iInitDisplayStart=g.iDisplayStart,r._iDisplayStart=g.iDisplayStart);null!==g.iDeferLoading&&(r.bDeferLoading=!0,e=f.isArray(g.iDeferLoading),r._iRecordsDisplay=e?g.iDeferLoading[0]:g.iDeferLoading,r._iRecordsTotal=e?g.iDeferLoading[1]:g.iDeferLoading);var y=r.oLanguage;f.extend(!0,y,g.oLanguage);y.sUrl&&(f.ajax({dataType:"json",url:y.sUrl,success:function(a){Fa(a);L(p.oLanguage,
                a);f.extend(!0,y,a);ia(r)},error:function(){ia(r)}}),m=!0);null===g.asStripeClasses&&(r.asStripeClasses=[x.sStripeOdd,x.sStripeEven]);e=r.asStripeClasses;var z=v.children("tbody").find("tr").eq(0);-1!==f.inArray(!0,f.map(e,function(a,b){return z.hasClass(a)}))&&(f("tbody tr",this).removeClass(e.join(" ")),r.asDestroyStripes=e.slice());e=[];u=this.getElementsByTagName("thead");0!==u.length&&(ea(r.aoHeader,u[0]),e=ta(r));if(null===g.aoColumns)for(u=[],k=0,l=e.length;k<l;k++)u.push(null);else u=g.aoColumns;
            k=0;for(l=u.length;k<l;k++)Ha(r,e?e[k]:null);mb(r,g.aoColumnDefs,u,function(a,b){la(r,a,b)});if(z.length){var B=function(a,b){return null!==a.getAttribute("data-"+b)?b:null};f(z[0]).children("th, td").each(function(a,b){var c=r.aoColumns[a];if(c.mData===a){var d=B(b,"sort")||B(b,"order");b=B(b,"filter")||B(b,"search");if(null!==d||null!==b)c.mData={_:a+".display",sort:null!==d?a+".@data-"+d:n,type:null!==d?a+".@data-"+d:n,filter:null!==b?a+".@data-"+b:n},la(r,a)}})}var C=r.oFeatures;e=function(){if(g.aaSorting===
                n){var a=r.aaSorting;k=0;for(l=a.length;k<l;k++)a[k][1]=r.aoColumns[k].asSorting[0]}za(r);C.bSort&&D(r,"aoDrawCallback",function(){if(r.bSorted){var a=X(r),b={};f.each(a,function(a,c){b[c.src]=c.dir});A(r,null,"order",[r,a,b]);Mb(r)}});D(r,"aoDrawCallback",function(){(r.bSorted||"ssp"===I(r)||C.bDeferRender)&&za(r)},"sc");a=v.children("caption").each(function(){this._captionSide=f(this).css("caption-side")});var b=v.children("thead");0===b.length&&(b=f("<thead/>").appendTo(v));r.nTHead=b[0];b=v.children("tbody");
                0===b.length&&(b=f("<tbody/>").appendTo(v));r.nTBody=b[0];b=v.children("tfoot");0===b.length&&0<a.length&&(""!==r.oScroll.sX||""!==r.oScroll.sY)&&(b=f("<tfoot/>").appendTo(v));0===b.length||0===b.children().length?v.addClass(x.sNoFooter):0<b.length&&(r.nTFoot=b[0],ea(r.aoFooter,r.nTFoot));if(g.aaData)for(k=0;k<g.aaData.length;k++)R(r,g.aaData[k]);else(r.bDeferLoading||"dom"==I(r))&&oa(r,f(r.nTBody).children("tr"));r.aiDisplay=r.aiDisplayMaster.slice();r.bInitialised=!0;!1===m&&ia(r)};g.bStateSave?
                (C.bStateSave=!0,D(r,"aoDrawCallback",Aa,"state_save"),Nb(r,g,e)):e()}});b=null;return this},C,t,z,bb={},Qb=/[\r\n\u2028]/g,Da=/<.*?>/g,cc=/^\d{2,4}[\.\/\-]\d{1,2}[\.\/\-]\d{1,2}([T ]{1}\d{1,2}[:\.]\d{2}([\.:]\d{2})?)?$/,dc=/(\/|\.|\*|\+|\?|\||\(|\)|\[|\]|\{|\}|\\|\$|\^|\-)/g,ab=/[',$£€¥%\u2009\u202F\u20BD\u20a9\u20BArfkɃΞ]/gi,P=function(a){return a&&!0!==a&&"-"!==a?!1:!0},Rb=function(a){var b=parseInt(a,10);return!isNaN(b)&&isFinite(a)?b:null},Sb=function(a,b){bb[b]||(bb[b]=new RegExp(Ta(b),"g"));
        return"string"===typeof a&&"."!==b?a.replace(/\./g,"").replace(bb[b],"."):a},cb=function(a,b,c){var d="string"===typeof a;if(P(a))return!0;b&&d&&(a=Sb(a,b));c&&d&&(a=a.replace(ab,""));return!isNaN(parseFloat(a))&&isFinite(a)},Tb=function(a,b,c){return P(a)?!0:P(a)||"string"===typeof a?cb(a.replace(Da,""),b,c)?!0:null:null},K=function(a,b,c){var d=[],e=0,h=a.length;if(c!==n)for(;e<h;e++)a[e]&&a[e][b]&&d.push(a[e][b][c]);else for(;e<h;e++)a[e]&&d.push(a[e][b]);return d},ka=function(a,b,c,d){var e=[],
        h=0,g=b.length;if(d!==n)for(;h<g;h++)a[b[h]][c]&&e.push(a[b[h]][c][d]);else for(;h<g;h++)e.push(a[b[h]][c]);return e},Y=function(a,b){var c=[];if(b===n){b=0;var d=a}else d=b,b=a;for(a=b;a<d;a++)c.push(a);return c},Ub=function(a){for(var b=[],c=0,d=a.length;c<d;c++)a[c]&&b.push(a[c]);return b},sa=function(a){a:{if(!(2>a.length)){var b=a.slice().sort();for(var c=b[0],d=1,e=b.length;d<e;d++){if(b[d]===c){b=!1;break a}c=b[d]}}b=!0}if(b)return a.slice();b=[];e=a.length;var h,g=0;d=0;a:for(;d<e;d++){c=
        a[d];for(h=0;h<g;h++)if(b[h]===c)continue a;b.push(c);g++}return b};q.util={throttle:function(a,b){var c=b!==n?b:200,d,e;return function(){var b=this,g=+new Date,f=arguments;d&&g<d+c?(clearTimeout(e),e=setTimeout(function(){d=n;a.apply(b,f)},c)):(d=g,a.apply(b,f))}},escapeRegex:function(a){return a.replace(dc,"\\$1")}};var E=function(a,b,c){a[b]!==n&&(a[c]=a[b])},ca=/\[.*?\]$/,W=/\(\)$/,Ta=q.util.escapeRegex,xa=f("<div>")[0],$b=xa.textContent!==n,bc=/<.*?>/g,Ra=q.util.throttle,Vb=[],G=Array.prototype,
        ec=function(a){var b,c=q.settings,d=f.map(c,function(a,b){return a.nTable});if(a){if(a.nTable&&a.oApi)return[a];if(a.nodeName&&"table"===a.nodeName.toLowerCase()){var e=f.inArray(a,d);return-1!==e?[c[e]]:null}if(a&&"function"===typeof a.settings)return a.settings().toArray();"string"===typeof a?b=f(a):a instanceof f&&(b=a)}else return[];if(b)return b.map(function(a){e=f.inArray(this,d);return-1!==e?c[e]:null}).toArray()};var x=function(a,b){if(!(this instanceof x))return new x(a,b);var c=[],d=function(a){(a=
        ec(a))&&c.push.apply(c,a)};if(f.isArray(a))for(var e=0,h=a.length;e<h;e++)d(a[e]);else d(a);this.context=sa(c);b&&f.merge(this,b);this.selector={rows:null,cols:null,opts:null};x.extend(this,this,Vb)};q.Api=x;f.extend(x.prototype,{any:function(){return 0!==this.count()},concat:G.concat,context:[],count:function(){return this.flatten().length},each:function(a){for(var b=0,c=this.length;b<c;b++)a.call(this,this[b],b,this);return this},eq:function(a){var b=this.context;return b.length>a?new x(b[a],this[a]):
            null},filter:function(a){var b=[];if(G.filter)b=G.filter.call(this,a,this);else for(var c=0,d=this.length;c<d;c++)a.call(this,this[c],c,this)&&b.push(this[c]);return new x(this.context,b)},flatten:function(){var a=[];return new x(this.context,a.concat.apply(a,this.toArray()))},join:G.join,indexOf:G.indexOf||function(a,b){b=b||0;for(var c=this.length;b<c;b++)if(this[b]===a)return b;return-1},iterator:function(a,b,c,d){var e=[],h,g,f=this.context,l,m=this.selector;"string"===typeof a&&(d=c,c=b,b=a,
            a=!1);var p=0;for(h=f.length;p<h;p++){var q=new x(f[p]);if("table"===b){var u=c.call(q,f[p],p);u!==n&&e.push(u)}else if("columns"===b||"rows"===b)u=c.call(q,f[p],this[p],p),u!==n&&e.push(u);else if("column"===b||"column-rows"===b||"row"===b||"cell"===b){var t=this[p];"column-rows"===b&&(l=Ea(f[p],m.opts));var w=0;for(g=t.length;w<g;w++)u=t[w],u="cell"===b?c.call(q,f[p],u.row,u.column,p,w):c.call(q,f[p],u,p,w,l),u!==n&&e.push(u)}}return e.length||d?(a=new x(f,a?e.concat.apply([],e):e),b=a.selector,
            b.rows=m.rows,b.cols=m.cols,b.opts=m.opts,a):this},lastIndexOf:G.lastIndexOf||function(a,b){return this.indexOf.apply(this.toArray.reverse(),arguments)},length:0,map:function(a){var b=[];if(G.map)b=G.map.call(this,a,this);else for(var c=0,d=this.length;c<d;c++)b.push(a.call(this,this[c],c));return new x(this.context,b)},pluck:function(a){return this.map(function(b){return b[a]})},pop:G.pop,push:G.push,reduce:G.reduce||function(a,b){return lb(this,a,b,0,this.length,1)},reduceRight:G.reduceRight||function(a,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         b){return lb(this,a,b,this.length-1,-1,-1)},reverse:G.reverse,selector:null,shift:G.shift,slice:function(){return new x(this.context,this)},sort:G.sort,splice:G.splice,toArray:function(){return G.slice.call(this)},to$:function(){return f(this)},toJQuery:function(){return f(this)},unique:function(){return new x(this.context,sa(this))},unshift:G.unshift});x.extend=function(a,b,c){if(c.length&&b&&(b instanceof x||b.__dt_wrapper)){var d,e=function(a,b,c){return function(){var d=b.apply(a,arguments);x.extend(d,
        d,c.methodExt);return d}};var h=0;for(d=c.length;h<d;h++){var f=c[h];b[f.name]="function"===f.type?e(a,f.val,f):"object"===f.type?{}:f.val;b[f.name].__dt_wrapper=!0;x.extend(a,b[f.name],f.propExt)}}};x.register=t=function(a,b){if(f.isArray(a))for(var c=0,d=a.length;c<d;c++)x.register(a[c],b);else{d=a.split(".");var e=Vb,h;a=0;for(c=d.length;a<c;a++){var g=(h=-1!==d[a].indexOf("()"))?d[a].replace("()",""):d[a];a:{var k=0;for(var l=e.length;k<l;k++)if(e[k].name===g){k=e[k];break a}k=null}k||(k={name:g,
        val:{},methodExt:[],propExt:[],type:"object"},e.push(k));a===c-1?(k.val=b,k.type="function"===typeof b?"function":f.isPlainObject(b)?"object":"other"):e=h?k.methodExt:k.propExt}}};x.registerPlural=z=function(a,b,c){x.register(a,c);x.register(b,function(){var a=c.apply(this,arguments);return a===this?this:a instanceof x?a.length?f.isArray(a[0])?new x(a.context,a[0]):a[0]:n:a})};var Wb=function(a,b){if(f.isArray(a))return f.map(a,function(a){return Wb(a,b)});if("number"===typeof a)return[b[a]];var c=
        f.map(b,function(a,b){return a.nTable});return f(c).filter(a).map(function(a){a=f.inArray(this,c);return b[a]}).toArray()};t("tables()",function(a){return a!==n&&null!==a?new x(Wb(a,this.context)):this});t("table()",function(a){a=this.tables(a);var b=a.context;return b.length?new x(b[0]):a});z("tables().nodes()","table().node()",function(){return this.iterator("table",function(a){return a.nTable},1)});z("tables().body()","table().body()",function(){return this.iterator("table",function(a){return a.nTBody},
        1)});z("tables().header()","table().header()",function(){return this.iterator("table",function(a){return a.nTHead},1)});z("tables().footer()","table().footer()",function(){return this.iterator("table",function(a){return a.nTFoot},1)});z("tables().containers()","table().container()",function(){return this.iterator("table",function(a){return a.nTableWrapper},1)});t("draw()",function(a){return this.iterator("table",function(b){"page"===a?S(b):("string"===typeof a&&(a="full-hold"===a?!1:!0),U(b,!1===
        a))})});t("page()",function(a){return a===n?this.page.info().page:this.iterator("table",function(b){Wa(b,a)})});t("page.info()",function(a){if(0===this.context.length)return n;a=this.context[0];var b=a._iDisplayStart,c=a.oFeatures.bPaginate?a._iDisplayLength:-1,d=a.fnRecordsDisplay(),e=-1===c;return{page:e?0:Math.floor(b/c),pages:e?1:Math.ceil(d/c),start:b,end:a.fnDisplayEnd(),length:c,recordsTotal:a.fnRecordsTotal(),recordsDisplay:d,serverSide:"ssp"===I(a)}});t("page.len()",function(a){return a===
    n?0!==this.context.length?this.context[0]._iDisplayLength:n:this.iterator("table",function(b){Ua(b,a)})});var Xb=function(a,b,c){if(c){var d=new x(a);d.one("draw",function(){c(d.ajax.json())})}if("ssp"==I(a))U(a,b);else{J(a,!0);var e=a.jqXHR;e&&4!==e.readyState&&e.abort();ua(a,[],function(c){pa(a);c=va(a,c);for(var d=0,e=c.length;d<e;d++)R(a,c[d]);U(a,b);J(a,!1)})}};t("ajax.json()",function(){var a=this.context;if(0<a.length)return a[0].json});t("ajax.params()",function(){var a=this.context;if(0<
        a.length)return a[0].oAjaxData});t("ajax.reload()",function(a,b){return this.iterator("table",function(c){Xb(c,!1===b,a)})});t("ajax.url()",function(a){var b=this.context;if(a===n){if(0===b.length)return n;b=b[0];return b.ajax?f.isPlainObject(b.ajax)?b.ajax.url:b.ajax:b.sAjaxSource}return this.iterator("table",function(b){f.isPlainObject(b.ajax)?b.ajax.url=a:b.ajax=a})});t("ajax.url().load()",function(a,b){return this.iterator("table",function(c){Xb(c,!1===b,a)})});var db=function(a,b,c,d,e){var h=
        [],g,k,l;var m=typeof b;b&&"string"!==m&&"function"!==m&&b.length!==n||(b=[b]);m=0;for(k=b.length;m<k;m++){var p=b[m]&&b[m].split&&!b[m].match(/[\[\(:]/)?b[m].split(","):[b[m]];var q=0;for(l=p.length;q<l;q++)(g=c("string"===typeof p[q]?f.trim(p[q]):p[q]))&&g.length&&(h=h.concat(g))}a=C.selector[a];if(a.length)for(m=0,k=a.length;m<k;m++)h=a[m](d,e,h);return sa(h)},eb=function(a){a||(a={});a.filter&&a.search===n&&(a.search=a.filter);return f.extend({search:"none",order:"current",page:"all"},a)},fb=
        function(a){for(var b=0,c=a.length;b<c;b++)if(0<a[b].length)return a[0]=a[b],a[0].length=1,a.length=1,a.context=[a.context[b]],a;a.length=0;return a},Ea=function(a,b){var c=[],d=a.aiDisplay;var e=a.aiDisplayMaster;var h=b.search;var g=b.order;b=b.page;if("ssp"==I(a))return"removed"===h?[]:Y(0,e.length);if("current"==b)for(g=a._iDisplayStart,a=a.fnDisplayEnd();g<a;g++)c.push(d[g]);else if("current"==g||"applied"==g)if("none"==h)c=e.slice();else if("applied"==h)c=d.slice();else{if("removed"==h){var k=
        {};g=0;for(a=d.length;g<a;g++)k[d[g]]=null;c=f.map(e,function(a){return k.hasOwnProperty(a)?null:a})}}else if("index"==g||"original"==g)for(g=0,a=a.aoData.length;g<a;g++)"none"==h?c.push(g):(e=f.inArray(g,d),(-1===e&&"removed"==h||0<=e&&"applied"==h)&&c.push(g));return c},fc=function(a,b,c){var d;return db("row",b,function(b){var e=Rb(b),g=a.aoData;if(null!==e&&!c)return[e];d||(d=Ea(a,c));if(null!==e&&-1!==f.inArray(e,d))return[e];if(null===b||b===n||""===b)return d;if("function"===typeof b)return f.map(d,
        function(a){var c=g[a];return b(a,c._aData,c.nTr)?a:null});if(b.nodeName){e=b._DT_RowIndex;var k=b._DT_CellIndex;if(e!==n)return g[e]&&g[e].nTr===b?[e]:[];if(k)return g[k.row]&&g[k.row].nTr===b.parentNode?[k.row]:[];e=f(b).closest("*[data-dt-row]");return e.length?[e.data("dt-row")]:[]}if("string"===typeof b&&"#"===b.charAt(0)&&(e=a.aIds[b.replace(/^#/,"")],e!==n))return[e.idx];e=Ub(ka(a.aoData,d,"nTr"));return f(e).filter(b).map(function(){return this._DT_RowIndex}).toArray()},a,c)};t("rows()",function(a,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     b){a===n?a="":f.isPlainObject(a)&&(b=a,a="");b=eb(b);var c=this.iterator("table",function(c){return fc(c,a,b)},1);c.selector.rows=a;c.selector.opts=b;return c});t("rows().nodes()",function(){return this.iterator("row",function(a,b){return a.aoData[b].nTr||n},1)});t("rows().data()",function(){return this.iterator(!0,"rows",function(a,b){return ka(a.aoData,b,"_aData")},1)});z("rows().cache()","row().cache()",function(a){return this.iterator("row",function(b,c){b=b.aoData[c];return"search"===a?b._aFilterData:
        b._aSortData},1)});z("rows().invalidate()","row().invalidate()",function(a){return this.iterator("row",function(b,c){da(b,c,a)})});z("rows().indexes()","row().index()",function(){return this.iterator("row",function(a,b){return b},1)});z("rows().ids()","row().id()",function(a){for(var b=[],c=this.context,d=0,e=c.length;d<e;d++)for(var f=0,g=this[d].length;f<g;f++){var k=c[d].rowIdFn(c[d].aoData[this[d][f]]._aData);b.push((!0===a?"#":"")+k)}return new x(c,b)});z("rows().remove()","row().remove()",function(){var a=
        this;this.iterator("row",function(b,c,d){var e=b.aoData,f=e[c],g,k;e.splice(c,1);var l=0;for(g=e.length;l<g;l++){var m=e[l];var p=m.anCells;null!==m.nTr&&(m.nTr._DT_RowIndex=l);if(null!==p)for(m=0,k=p.length;m<k;m++)p[m]._DT_CellIndex.row=l}qa(b.aiDisplayMaster,c);qa(b.aiDisplay,c);qa(a[d],c,!1);0<b._iRecordsDisplay&&b._iRecordsDisplay--;Va(b);c=b.rowIdFn(f._aData);c!==n&&delete b.aIds[c]});this.iterator("table",function(a){for(var b=0,d=a.aoData.length;b<d;b++)a.aoData[b].idx=b});return this});t("rows.add()",
        function(a){var b=this.iterator("table",function(b){var c,d=[];var f=0;for(c=a.length;f<c;f++){var k=a[f];k.nodeName&&"TR"===k.nodeName.toUpperCase()?d.push(oa(b,k)[0]):d.push(R(b,k))}return d},1),c=this.rows(-1);c.pop();f.merge(c,b);return c});t("row()",function(a,b){return fb(this.rows(a,b))});t("row().data()",function(a){var b=this.context;if(a===n)return b.length&&this.length?b[0].aoData[this[0]]._aData:n;var c=b[0].aoData[this[0]];c._aData=a;f.isArray(a)&&c.nTr&&c.nTr.id&&Q(b[0].rowId)(a,c.nTr.id);
        da(b[0],this[0],"data");return this});t("row().node()",function(){var a=this.context;return a.length&&this.length?a[0].aoData[this[0]].nTr||null:null});t("row.add()",function(a){a instanceof f&&a.length&&(a=a[0]);var b=this.iterator("table",function(b){return a.nodeName&&"TR"===a.nodeName.toUpperCase()?oa(b,a)[0]:R(b,a)});return this.row(b[0])});var gc=function(a,b,c,d){var e=[],h=function(b,c){if(f.isArray(b)||b instanceof f)for(var d=0,g=b.length;d<g;d++)h(b[d],c);else b.nodeName&&"tr"===b.nodeName.toLowerCase()?
        e.push(b):(d=f("<tr><td/></tr>").addClass(c),f("td",d).addClass(c).html(b)[0].colSpan=V(a),e.push(d[0]))};h(c,d);b._details&&b._details.detach();b._details=f(e);b._detailsShow&&b._details.insertAfter(b.nTr)},gb=function(a,b){var c=a.context;c.length&&(a=c[0].aoData[b!==n?b:a[0]])&&a._details&&(a._details.remove(),a._detailsShow=n,a._details=n)},Yb=function(a,b){var c=a.context;c.length&&a.length&&(a=c[0].aoData[a[0]],a._details&&((a._detailsShow=b)?a._details.insertAfter(a.nTr):a._details.detach(),
        hc(c[0])))},hc=function(a){var b=new x(a),c=a.aoData;b.off("draw.dt.DT_details column-visibility.dt.DT_details destroy.dt.DT_details");0<K(c,"_details").length&&(b.on("draw.dt.DT_details",function(d,e){a===e&&b.rows({page:"current"}).eq(0).each(function(a){a=c[a];a._detailsShow&&a._details.insertAfter(a.nTr)})}),b.on("column-visibility.dt.DT_details",function(b,e,f,g){if(a===e)for(e=V(e),f=0,g=c.length;f<g;f++)b=c[f],b._details&&b._details.children("td[colspan]").attr("colspan",e)}),b.on("destroy.dt.DT_details",
        function(d,e){if(a===e)for(d=0,e=c.length;d<e;d++)c[d]._details&&gb(b,d)}))};t("row().child()",function(a,b){var c=this.context;if(a===n)return c.length&&this.length?c[0].aoData[this[0]]._details:n;!0===a?this.child.show():!1===a?gb(this):c.length&&this.length&&gc(c[0],c[0].aoData[this[0]],a,b);return this});t(["row().child.show()","row().child().show()"],function(a){Yb(this,!0);return this});t(["row().child.hide()","row().child().hide()"],function(){Yb(this,!1);return this});t(["row().child.remove()",
        "row().child().remove()"],function(){gb(this);return this});t("row().child.isShown()",function(){var a=this.context;return a.length&&this.length?a[0].aoData[this[0]]._detailsShow||!1:!1});var ic=/^([^:]+):(name|visIdx|visible)$/,Zb=function(a,b,c,d,e){c=[];d=0;for(var f=e.length;d<f;d++)c.push(F(a,e[d],b));return c},jc=function(a,b,c){var d=a.aoColumns,e=K(d,"sName"),h=K(d,"nTh");return db("column",b,function(b){var g=Rb(b);if(""===b)return Y(d.length);if(null!==g)return[0<=g?g:d.length+g];if("function"===
        typeof b){var l=Ea(a,c);return f.map(d,function(c,d){return b(d,Zb(a,d,0,0,l),h[d])?d:null})}var m="string"===typeof b?b.match(ic):"";if(m)switch(m[2]){case "visIdx":case "visible":g=parseInt(m[1],10);if(0>g){var p=f.map(d,function(a,b){return a.bVisible?b:null});return[p[p.length+g]]}return[aa(a,g)];case "name":return f.map(e,function(a,b){return a===m[1]?b:null});default:return[]}if(b.nodeName&&b._DT_CellIndex)return[b._DT_CellIndex.column];g=f(h).filter(b).map(function(){return f.inArray(this,
        h)}).toArray();if(g.length||!b.nodeName)return g;g=f(b).closest("*[data-dt-column]");return g.length?[g.data("dt-column")]:[]},a,c)};t("columns()",function(a,b){a===n?a="":f.isPlainObject(a)&&(b=a,a="");b=eb(b);var c=this.iterator("table",function(c){return jc(c,a,b)},1);c.selector.cols=a;c.selector.opts=b;return c});z("columns().header()","column().header()",function(a,b){return this.iterator("column",function(a,b){return a.aoColumns[b].nTh},1)});z("columns().footer()","column().footer()",function(a,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                b){return this.iterator("column",function(a,b){return a.aoColumns[b].nTf},1)});z("columns().data()","column().data()",function(){return this.iterator("column-rows",Zb,1)});z("columns().dataSrc()","column().dataSrc()",function(){return this.iterator("column",function(a,b){return a.aoColumns[b].mData},1)});z("columns().cache()","column().cache()",function(a){return this.iterator("column-rows",function(b,c,d,e,f){return ka(b.aoData,f,"search"===a?"_aFilterData":"_aSortData",c)},1)});z("columns().nodes()",
        "column().nodes()",function(){return this.iterator("column-rows",function(a,b,c,d,e){return ka(a.aoData,e,"anCells",b)},1)});z("columns().visible()","column().visible()",function(a,b){var c=this,d=this.iterator("column",function(b,c){if(a===n)return b.aoColumns[c].bVisible;var d=b.aoColumns,e=d[c],h=b.aoData,m;if(a!==n&&e.bVisible!==a){if(a){var p=f.inArray(!0,K(d,"bVisible"),c+1);d=0;for(m=h.length;d<m;d++){var q=h[d].nTr;b=h[d].anCells;q&&q.insertBefore(b[c],b[p]||null)}}else f(K(b.aoData,"anCells",
        c)).detach();e.bVisible=a}});a!==n&&this.iterator("table",function(d){fa(d,d.aoHeader);fa(d,d.aoFooter);d.aiDisplay.length||f(d.nTBody).find("td[colspan]").attr("colspan",V(d));Aa(d);c.iterator("column",function(c,d){A(c,null,"column-visibility",[c,d,a,b])});(b===n||b)&&c.columns.adjust()});return d});z("columns().indexes()","column().index()",function(a){return this.iterator("column",function(b,c){return"visible"===a?ba(b,c):c},1)});t("columns.adjust()",function(){return this.iterator("table",function(a){Z(a)},
        1)});t("column.index()",function(a,b){if(0!==this.context.length){var c=this.context[0];if("fromVisible"===a||"toData"===a)return aa(c,b);if("fromData"===a||"toVisible"===a)return ba(c,b)}});t("column()",function(a,b){return fb(this.columns(a,b))});var kc=function(a,b,c){var d=a.aoData,e=Ea(a,c),h=Ub(ka(d,e,"anCells")),g=f([].concat.apply([],h)),k,l=a.aoColumns.length,m,p,q,u,t,w;return db("cell",b,function(b){var c="function"===typeof b;if(null===b||b===n||c){m=[];p=0;for(q=e.length;p<q;p++)for(k=
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 e[p],u=0;u<l;u++)t={row:k,column:u},c?(w=d[k],b(t,F(a,k,u),w.anCells?w.anCells[u]:null)&&m.push(t)):m.push(t);return m}if(f.isPlainObject(b))return b.column!==n&&b.row!==n&&-1!==f.inArray(b.row,e)?[b]:[];c=g.filter(b).map(function(a,b){return{row:b._DT_CellIndex.row,column:b._DT_CellIndex.column}}).toArray();if(c.length||!b.nodeName)return c;w=f(b).closest("*[data-dt-row]");return w.length?[{row:w.data("dt-row"),column:w.data("dt-column")}]:[]},a,c)};t("cells()",function(a,b,c){f.isPlainObject(a)&&
    (a.row===n?(c=a,a=null):(c=b,b=null));f.isPlainObject(b)&&(c=b,b=null);if(null===b||b===n)return this.iterator("table",function(b){return kc(b,a,eb(c))});var d=c?{page:c.page,order:c.order,search:c.search}:{},e=this.columns(b,d),h=this.rows(a,d),g,k,l,m;d=this.iterator("table",function(a,b){a=[];g=0;for(k=h[b].length;g<k;g++)for(l=0,m=e[b].length;l<m;l++)a.push({row:h[b][g],column:e[b][l]});return a},1);d=c&&c.selected?this.cells(d,c):d;f.extend(d.selector,{cols:b,rows:a,opts:c});return d});z("cells().nodes()",
        "cell().node()",function(){return this.iterator("cell",function(a,b,c){return(a=a.aoData[b])&&a.anCells?a.anCells[c]:n},1)});t("cells().data()",function(){return this.iterator("cell",function(a,b,c){return F(a,b,c)},1)});z("cells().cache()","cell().cache()",function(a){a="search"===a?"_aFilterData":"_aSortData";return this.iterator("cell",function(b,c,d){return b.aoData[c][a][d]},1)});z("cells().render()","cell().render()",function(a){return this.iterator("cell",function(b,c,d){return F(b,c,d,a)},
        1)});z("cells().indexes()","cell().index()",function(){return this.iterator("cell",function(a,b,c){return{row:b,column:c,columnVisible:ba(a,c)}},1)});z("cells().invalidate()","cell().invalidate()",function(a){return this.iterator("cell",function(b,c,d){da(b,c,a,d)})});t("cell()",function(a,b,c){return fb(this.cells(a,b,c))});t("cell().data()",function(a){var b=this.context,c=this[0];if(a===n)return b.length&&c.length?F(b[0],c[0].row,c[0].column):n;nb(b[0],c[0].row,c[0].column,a);da(b[0],c[0].row,
        "data",c[0].column);return this});t("order()",function(a,b){var c=this.context;if(a===n)return 0!==c.length?c[0].aaSorting:n;"number"===typeof a?a=[[a,b]]:a.length&&!f.isArray(a[0])&&(a=Array.prototype.slice.call(arguments));return this.iterator("table",function(b){b.aaSorting=a.slice()})});t("order.listener()",function(a,b,c){return this.iterator("table",function(d){Pa(d,a,b,c)})});t("order.fixed()",function(a){if(!a){var b=this.context;b=b.length?b[0].aaSortingFixed:n;return f.isArray(b)?{pre:b}:
        b}return this.iterator("table",function(b){b.aaSortingFixed=f.extend(!0,{},a)})});t(["columns().order()","column().order()"],function(a){var b=this;return this.iterator("table",function(c,d){var e=[];f.each(b[d],function(b,c){e.push([c,a])});c.aaSorting=e})});t("search()",function(a,b,c,d){var e=this.context;return a===n?0!==e.length?e[0].oPreviousSearch.sSearch:n:this.iterator("table",function(e){e.oFeatures.bFilter&&ha(e,f.extend({},e.oPreviousSearch,{sSearch:a+"",bRegex:null===b?!1:b,bSmart:null===
        c?!0:c,bCaseInsensitive:null===d?!0:d}),1)})});z("columns().search()","column().search()",function(a,b,c,d){return this.iterator("column",function(e,h){var g=e.aoPreSearchCols;if(a===n)return g[h].sSearch;e.oFeatures.bFilter&&(f.extend(g[h],{sSearch:a+"",bRegex:null===b?!1:b,bSmart:null===c?!0:c,bCaseInsensitive:null===d?!0:d}),ha(e,e.oPreviousSearch,1))})});t("state()",function(){return this.context.length?this.context[0].oSavedState:null});t("state.clear()",function(){return this.iterator("table",
        function(a){a.fnStateSaveCallback.call(a.oInstance,a,{})})});t("state.loaded()",function(){return this.context.length?this.context[0].oLoadedState:null});t("state.save()",function(){return this.iterator("table",function(a){Aa(a)})});q.versionCheck=q.fnVersionCheck=function(a){var b=q.version.split(".");a=a.split(".");for(var c,d,e=0,f=a.length;e<f;e++)if(c=parseInt(b[e],10)||0,d=parseInt(a[e],10)||0,c!==d)return c>d;return!0};q.isDataTable=q.fnIsDataTable=function(a){var b=f(a).get(0),c=!1;if(a instanceof
        q.Api)return!0;f.each(q.settings,function(a,e){a=e.nScrollHead?f("table",e.nScrollHead)[0]:null;var d=e.nScrollFoot?f("table",e.nScrollFoot)[0]:null;if(e.nTable===b||a===b||d===b)c=!0});return c};q.tables=q.fnTables=function(a){var b=!1;f.isPlainObject(a)&&(b=a.api,a=a.visible);var c=f.map(q.settings,function(b){if(!a||a&&f(b.nTable).is(":visible"))return b.nTable});return b?new x(c):c};q.camelToHungarian=L;t("$()",function(a,b){b=this.rows(b).nodes();b=f(b);return f([].concat(b.filter(a).toArray(),
        b.find(a).toArray()))});f.each(["on","one","off"],function(a,b){t(b+"()",function(){var a=Array.prototype.slice.call(arguments);a[0]=f.map(a[0].split(/\s/),function(a){return a.match(/\.dt\b/)?a:a+".dt"}).join(" ");var d=f(this.tables().nodes());d[b].apply(d,a);return this})});t("clear()",function(){return this.iterator("table",function(a){pa(a)})});t("settings()",function(){return new x(this.context,this.context)});t("init()",function(){var a=this.context;return a.length?a[0].oInit:null});t("data()",
        function(){return this.iterator("table",function(a){return K(a.aoData,"_aData")}).flatten()});t("destroy()",function(a){a=a||!1;return this.iterator("table",function(b){var c=b.nTableWrapper.parentNode,d=b.oClasses,e=b.nTable,h=b.nTBody,g=b.nTHead,k=b.nTFoot,l=f(e);h=f(h);var m=f(b.nTableWrapper),p=f.map(b.aoData,function(a){return a.nTr}),n;b.bDestroying=!0;A(b,"aoDestroyCallback","destroy",[b]);a||(new x(b)).columns().visible(!0);m.off(".DT").find(":not(tbody *)").off(".DT");f(y).off(".DT-"+b.sInstance);
        e!=g.parentNode&&(l.children("thead").detach(),l.append(g));k&&e!=k.parentNode&&(l.children("tfoot").detach(),l.append(k));b.aaSorting=[];b.aaSortingFixed=[];za(b);f(p).removeClass(b.asStripeClasses.join(" "));f("th, td",g).removeClass(d.sSortable+" "+d.sSortableAsc+" "+d.sSortableDesc+" "+d.sSortableNone);h.children().detach();h.append(p);g=a?"remove":"detach";l[g]();m[g]();!a&&c&&(c.insertBefore(e,b.nTableReinsertBefore),l.css("width",b.sDestroyWidth).removeClass(d.sTable),(n=b.asDestroyStripes.length)&&
        h.children().each(function(a){f(this).addClass(b.asDestroyStripes[a%n])}));c=f.inArray(b,q.settings);-1!==c&&q.settings.splice(c,1)})});f.each(["column","row","cell"],function(a,b){t(b+"s().every()",function(a){var c=this.selector.opts,e=this;return this.iterator(b,function(d,f,k,l,m){a.call(e[b](f,"cell"===b?k:c,"cell"===b?c:n),f,k,l,m)})})});t("i18n()",function(a,b,c){var d=this.context[0];a=T(a)(d.oLanguage);a===n&&(a=b);c!==n&&f.isPlainObject(a)&&(a=a[c]!==n?a[c]:a._);return a.replace("%d",c)});
    q.version="1.10.21";q.settings=[];q.models={};q.models.oSearch={bCaseInsensitive:!0,sSearch:"",bRegex:!1,bSmart:!0};q.models.oRow={nTr:null,anCells:null,_aData:[],_aSortData:null,_aFilterData:null,_sFilterRow:null,_sRowStripe:"",src:null,idx:-1};q.models.oColumn={idx:null,aDataSort:null,asSorting:null,bSearchable:null,bSortable:null,bVisible:null,_sManualType:null,_bAttrSrc:!1,fnCreatedCell:null,fnGetData:null,fnSetData:null,mData:null,mRender:null,nTh:null,nTf:null,sClass:null,sContentPadding:null,
        sDefaultContent:null,sName:null,sSortDataType:"std",sSortingClass:null,sSortingClassJUI:null,sTitle:null,sType:null,sWidth:null,sWidthOrig:null};q.defaults={aaData:null,aaSorting:[[0,"asc"]],aaSortingFixed:[],ajax:null,aLengthMenu:[10,25,50,100],aoColumns:null,aoColumnDefs:null,aoSearchCols:[],asStripeClasses:null,bAutoWidth:!0,bDeferRender:!1,bDestroy:!1,bFilter:!0,bInfo:!0,bLengthChange:!0,bPaginate:!0,bProcessing:!1,bRetrieve:!1,bScrollCollapse:!1,bServerSide:!1,bSort:!0,bSortMulti:!0,bSortCellsTop:!1,
        bSortClasses:!0,bStateSave:!1,fnCreatedRow:null,fnDrawCallback:null,fnFooterCallback:null,fnFormatNumber:function(a){return a.toString().replace(/\B(?=(\d{3})+(?!\d))/g,this.oLanguage.sThousands)},fnHeaderCallback:null,fnInfoCallback:null,fnInitComplete:null,fnPreDrawCallback:null,fnRowCallback:null,fnServerData:null,fnServerParams:null,fnStateLoadCallback:function(a){try{return JSON.parse((-1===a.iStateDuration?sessionStorage:localStorage).getItem("DataTables_"+a.sInstance+"_"+location.pathname))}catch(b){return{}}},
        fnStateLoadParams:null,fnStateLoaded:null,fnStateSaveCallback:function(a,b){try{(-1===a.iStateDuration?sessionStorage:localStorage).setItem("DataTables_"+a.sInstance+"_"+location.pathname,JSON.stringify(b))}catch(c){}},fnStateSaveParams:null,iStateDuration:7200,iDeferLoading:null,iDisplayLength:10,iDisplayStart:0,iTabIndex:0,oClasses:{},oLanguage:{oAria:{sSortAscending:": activate to sort column ascending",sSortDescending:": activate to sort column descending"},oPaginate:{sFirst:"First",sLast:"Last",
                sNext:"Next",sPrevious:"Previous"},sEmptyTable:"No data available in table",sInfo:"Showing _START_ to _END_ of _TOTAL_ entries",sInfoEmpty:"Showing 0 to 0 of 0 entries",sInfoFiltered:"(filtered from _MAX_ total entries)",sInfoPostFix:"",sDecimal:"",sThousands:",",sLengthMenu:"Show _MENU_ entries",sLoadingRecords:"Loading...",sProcessing:"Processing...",sSearch:"Search:",sSearchPlaceholder:"",sUrl:"",sZeroRecords:"No matching records found"},oSearch:f.extend({},q.models.oSearch),sAjaxDataProp:"data",
        sAjaxSource:null,sDom:"lfrtip",searchDelay:null,sPaginationType:"simple_numbers",sScrollX:"",sScrollXInner:"",sScrollY:"",sServerMethod:"GET",renderer:null,rowId:"DT_RowId"};H(q.defaults);q.defaults.column={aDataSort:null,iDataSort:-1,asSorting:["asc","desc"],bSearchable:!0,bSortable:!0,bVisible:!0,fnCreatedCell:null,mData:null,mRender:null,sCellType:"td",sClass:"",sContentPadding:"",sDefaultContent:null,sName:"",sSortDataType:"std",sTitle:null,sType:null,sWidth:null};H(q.defaults.column);q.models.oSettings=
        {oFeatures:{bAutoWidth:null,bDeferRender:null,bFilter:null,bInfo:null,bLengthChange:null,bPaginate:null,bProcessing:null,bServerSide:null,bSort:null,bSortMulti:null,bSortClasses:null,bStateSave:null},oScroll:{bCollapse:null,iBarWidth:0,sX:null,sXInner:null,sY:null},oLanguage:{fnInfoCallback:null},oBrowser:{bScrollOversize:!1,bScrollbarLeft:!1,bBounding:!1,barWidth:0},ajax:null,aanFeatures:[],aoData:[],aiDisplay:[],aiDisplayMaster:[],aIds:{},aoColumns:[],aoHeader:[],aoFooter:[],oPreviousSearch:{},
            aoPreSearchCols:[],aaSorting:null,aaSortingFixed:[],asStripeClasses:null,asDestroyStripes:[],sDestroyWidth:0,aoRowCallback:[],aoHeaderCallback:[],aoFooterCallback:[],aoDrawCallback:[],aoRowCreatedCallback:[],aoPreDrawCallback:[],aoInitComplete:[],aoStateSaveParams:[],aoStateLoadParams:[],aoStateLoaded:[],sTableId:"",nTable:null,nTHead:null,nTFoot:null,nTBody:null,nTableWrapper:null,bDeferLoading:!1,bInitialised:!1,aoOpenRows:[],sDom:null,searchDelay:null,sPaginationType:"two_button",iStateDuration:0,
            aoStateSave:[],aoStateLoad:[],oSavedState:null,oLoadedState:null,sAjaxSource:null,sAjaxDataProp:null,bAjaxDataGet:!0,jqXHR:null,json:n,oAjaxData:n,fnServerData:null,aoServerParams:[],sServerMethod:null,fnFormatNumber:null,aLengthMenu:null,iDraw:0,bDrawing:!1,iDrawError:-1,_iDisplayLength:10,_iDisplayStart:0,_iRecordsTotal:0,_iRecordsDisplay:0,oClasses:{},bFiltered:!1,bSorted:!1,bSortCellsTop:null,oInit:null,aoDestroyCallback:[],fnRecordsTotal:function(){return"ssp"==I(this)?1*this._iRecordsTotal:
                this.aiDisplayMaster.length},fnRecordsDisplay:function(){return"ssp"==I(this)?1*this._iRecordsDisplay:this.aiDisplay.length},fnDisplayEnd:function(){var a=this._iDisplayLength,b=this._iDisplayStart,c=b+a,d=this.aiDisplay.length,e=this.oFeatures,f=e.bPaginate;return e.bServerSide?!1===f||-1===a?b+d:Math.min(b+a,this._iRecordsDisplay):!f||c>d||-1===a?d:c},oInstance:null,sInstance:null,iTabIndex:0,nScrollHead:null,nScrollFoot:null,aLastSort:[],oPlugins:{},rowIdFn:null,rowId:null};q.ext=C={buttons:{},
        classes:{},builder:"-source-",errMode:"alert",feature:[],search:[],selector:{cell:[],column:[],row:[]},internal:{},legacy:{ajax:null},pager:{},renderer:{pageButton:{},header:{}},order:{},type:{detect:[],search:{},order:{}},_unique:0,fnVersionCheck:q.fnVersionCheck,iApiIndex:0,oJUIClasses:{},sVersion:q.version};f.extend(C,{afnFiltering:C.search,aTypes:C.type.detect,ofnSearch:C.type.search,oSort:C.type.order,afnSortData:C.order,aoFeatures:C.feature,oApi:C.internal,oStdClasses:C.classes,oPagination:C.pager});
    f.extend(q.ext.classes,{sTable:"dataTable",sNoFooter:"no-footer",sPageButton:"paginate_button",sPageButtonActive:"current",sPageButtonDisabled:"disabled",sStripeOdd:"odd",sStripeEven:"even",sRowEmpty:"dataTables_empty",sWrapper:"dataTables_wrapper",sFilter:"dataTables_filter",sInfo:"dataTables_info",sPaging:"dataTables_paginate paging_",sLength:"dataTables_length",sProcessing:"dataTables_processing",sSortAsc:"sorting_asc",sSortDesc:"sorting_desc",sSortable:"sorting",sSortableAsc:"sorting_asc_disabled",
        sSortableDesc:"sorting_desc_disabled",sSortableNone:"sorting_disabled",sSortColumn:"sorting_",sFilterInput:"",sLengthSelect:"",sScrollWrapper:"dataTables_scroll",sScrollHead:"dataTables_scrollHead",sScrollHeadInner:"dataTables_scrollHeadInner",sScrollBody:"dataTables_scrollBody",sScrollFoot:"dataTables_scrollFoot",sScrollFootInner:"dataTables_scrollFootInner",sHeaderTH:"",sFooterTH:"",sSortJUIAsc:"",sSortJUIDesc:"",sSortJUI:"",sSortJUIAscAllowed:"",sSortJUIDescAllowed:"",sSortJUIWrapper:"",sSortIcon:"",
        sJUIHeader:"",sJUIFooter:""});var Ob=q.ext.pager;f.extend(Ob,{simple:function(a,b){return["previous","next"]},full:function(a,b){return["first","previous","next","last"]},numbers:function(a,b){return[ja(a,b)]},simple_numbers:function(a,b){return["previous",ja(a,b),"next"]},full_numbers:function(a,b){return["first","previous",ja(a,b),"next","last"]},first_last_numbers:function(a,b){return["first",ja(a,b),"last"]},_numbers:ja,numbers_length:7});f.extend(!0,q.ext.renderer,{pageButton:{_:function(a,b,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          c,d,e,h){var g=a.oClasses,k=a.oLanguage.oPaginate,l=a.oLanguage.oAria.paginate||{},m,p,q=0,t=function(b,d){var n,r=g.sPageButtonDisabled,u=function(b){Wa(a,b.data.action,!0)};var w=0;for(n=d.length;w<n;w++){var v=d[w];if(f.isArray(v)){var x=f("<"+(v.DT_el||"div")+"/>").appendTo(b);t(x,v)}else{m=null;p=v;x=a.iTabIndex;switch(v){case "ellipsis":b.append('<span class="ellipsis">&#x2026;</span>');break;case "first":m=k.sFirst;0===e&&(x=-1,p+=" "+r);break;case "previous":m=k.sPrevious;0===e&&(x=-1,p+=
                " "+r);break;case "next":m=k.sNext;if(0===h||e===h-1)x=-1,p+=" "+r;break;case "last":m=k.sLast;e===h-1&&(x=-1,p+=" "+r);break;default:m=v+1,p=e===v?g.sPageButtonActive:""}null!==m&&(x=f("<a>",{"class":g.sPageButton+" "+p,"aria-controls":a.sTableId,"aria-label":l[v],"data-dt-idx":q,tabindex:x,id:0===c&&"string"===typeof v?a.sTableId+"_"+v:null}).html(m).appendTo(b),Za(x,{action:v},u),q++)}}};try{var x=f(b).find(w.activeElement).data("dt-idx")}catch(lc){}t(f(b).empty(),d);x!==n&&f(b).find("[data-dt-idx="+
                x+"]").trigger("focus")}}});f.extend(q.ext.type.detect,[function(a,b){b=b.oLanguage.sDecimal;return cb(a,b)?"num"+b:null},function(a,b){if(a&&!(a instanceof Date)&&!cc.test(a))return null;b=Date.parse(a);return null!==b&&!isNaN(b)||P(a)?"date":null},function(a,b){b=b.oLanguage.sDecimal;return cb(a,b,!0)?"num-fmt"+b:null},function(a,b){b=b.oLanguage.sDecimal;return Tb(a,b)?"html-num"+b:null},function(a,b){b=b.oLanguage.sDecimal;return Tb(a,b,!0)?"html-num-fmt"+b:null},function(a,b){return P(a)||"string"===
    typeof a&&-1!==a.indexOf("<")?"html":null}]);f.extend(q.ext.type.search,{html:function(a){return P(a)?a:"string"===typeof a?a.replace(Qb," ").replace(Da,""):""},string:function(a){return P(a)?a:"string"===typeof a?a.replace(Qb," "):a}});var Ca=function(a,b,c,d){if(0!==a&&(!a||"-"===a))return-Infinity;b&&(a=Sb(a,b));a.replace&&(c&&(a=a.replace(c,"")),d&&(a=a.replace(d,"")));return 1*a};f.extend(C.type.order,{"date-pre":function(a){a=Date.parse(a);return isNaN(a)?-Infinity:a},"html-pre":function(a){return P(a)?
            "":a.replace?a.replace(/<.*?>/g,"").toLowerCase():a+""},"string-pre":function(a){return P(a)?"":"string"===typeof a?a.toLowerCase():a.toString?a.toString():""},"string-asc":function(a,b){return a<b?-1:a>b?1:0},"string-desc":function(a,b){return a<b?1:a>b?-1:0}});Ga("");f.extend(!0,q.ext.renderer,{header:{_:function(a,b,c,d){f(a.nTable).on("order.dt.DT",function(e,f,g,k){a===f&&(e=c.idx,b.removeClass(c.sSortingClass+" "+d.sSortAsc+" "+d.sSortDesc).addClass("asc"==k[e]?d.sSortAsc:"desc"==k[e]?d.sSortDesc:
                c.sSortingClass))})},jqueryui:function(a,b,c,d){f("<div/>").addClass(d.sSortJUIWrapper).append(b.contents()).append(f("<span/>").addClass(d.sSortIcon+" "+c.sSortingClassJUI)).appendTo(b);f(a.nTable).on("order.dt.DT",function(e,f,g,k){a===f&&(e=c.idx,b.removeClass(d.sSortAsc+" "+d.sSortDesc).addClass("asc"==k[e]?d.sSortAsc:"desc"==k[e]?d.sSortDesc:c.sSortingClass),b.find("span."+d.sSortIcon).removeClass(d.sSortJUIAsc+" "+d.sSortJUIDesc+" "+d.sSortJUI+" "+d.sSortJUIAscAllowed+" "+d.sSortJUIDescAllowed).addClass("asc"==
            k[e]?d.sSortJUIAsc:"desc"==k[e]?d.sSortJUIDesc:c.sSortingClassJUI))})}}});var hb=function(a){return"string"===typeof a?a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"):a};q.render={number:function(a,b,c,d,e){return{display:function(f){if("number"!==typeof f&&"string"!==typeof f)return f;var g=0>f?"-":"",h=parseFloat(f);if(isNaN(h))return hb(f);h=h.toFixed(c);f=Math.abs(h);h=parseInt(f,10);f=c?b+(f-h).toFixed(c).substring(2):"";return g+(d||"")+h.toString().replace(/\B(?=(\d{3})+(?!\d))/g,
                a)+f+(e||"")}}},text:function(){return{display:hb,filter:hb}}};f.extend(q.ext.internal,{_fnExternApiFunc:Pb,_fnBuildAjax:ua,_fnAjaxUpdate:pb,_fnAjaxParameters:yb,_fnAjaxUpdateDraw:zb,_fnAjaxDataSrc:va,_fnAddColumn:Ha,_fnColumnOptions:la,_fnAdjustColumnSizing:Z,_fnVisibleToColumnIndex:aa,_fnColumnIndexToVisible:ba,_fnVisbleColumns:V,_fnGetColumns:na,_fnColumnTypes:Ja,_fnApplyColumnDefs:mb,_fnHungarianMap:H,_fnCamelToHungarian:L,_fnLanguageCompat:Fa,_fnBrowserDetect:kb,_fnAddData:R,_fnAddTr:oa,_fnNodeToDataIndex:function(a,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             b){return b._DT_RowIndex!==n?b._DT_RowIndex:null},_fnNodeToColumnIndex:function(a,b,c){return f.inArray(c,a.aoData[b].anCells)},_fnGetCellData:F,_fnSetCellData:nb,_fnSplitObjNotation:Ma,_fnGetObjectDataFn:T,_fnSetObjectDataFn:Q,_fnGetDataMaster:Na,_fnClearTable:pa,_fnDeleteIndex:qa,_fnInvalidate:da,_fnGetRowElements:La,_fnCreateTr:Ka,_fnBuildHead:ob,_fnDrawHead:fa,_fnDraw:S,_fnReDraw:U,_fnAddOptionsHtml:rb,_fnDetectHeader:ea,_fnGetUniqueThs:ta,_fnFeatureHtmlFilter:tb,_fnFilterComplete:ha,_fnFilterCustom:Cb,
        _fnFilterColumn:Bb,_fnFilter:Ab,_fnFilterCreateSearch:Sa,_fnEscapeRegex:Ta,_fnFilterData:Db,_fnFeatureHtmlInfo:wb,_fnUpdateInfo:Gb,_fnInfoMacros:Hb,_fnInitialise:ia,_fnInitComplete:wa,_fnLengthChange:Ua,_fnFeatureHtmlLength:sb,_fnFeatureHtmlPaginate:xb,_fnPageChange:Wa,_fnFeatureHtmlProcessing:ub,_fnProcessingDisplay:J,_fnFeatureHtmlTable:vb,_fnScrollDraw:ma,_fnApplyToChildren:N,_fnCalculateColumnWidths:Ia,_fnThrottle:Ra,_fnConvertToWidth:Ib,_fnGetWidestNode:Jb,_fnGetMaxLenString:Kb,_fnStringToCss:B,
        _fnSortFlatten:X,_fnSort:qb,_fnSortAria:Mb,_fnSortListener:Ya,_fnSortAttachListener:Pa,_fnSortingClasses:za,_fnSortData:Lb,_fnSaveState:Aa,_fnLoadState:Nb,_fnSettingsFromNode:Ba,_fnLog:O,_fnMap:M,_fnBindAction:Za,_fnCallbackReg:D,_fnCallbackFire:A,_fnLengthOverflow:Va,_fnRenderer:Qa,_fnDataSource:I,_fnRowAttributes:Oa,_fnExtend:$a,_fnCalculateEnd:function(){}});f.fn.dataTable=q;q.$=f;f.fn.dataTableSettings=q.settings;f.fn.dataTableExt=q.ext;f.fn.DataTable=function(a){return f(this).dataTable(a).api()};
    f.each(q,function(a,b){f.fn.DataTable[a]=b});return f.fn.dataTable});





/*!
 DataTables Bootstrap 3 integration
 ©2011-2015 SpryMedia Ltd - datatables.net/license
*/
var $jscomp=$jscomp||{};$jscomp.scope={};$jscomp.findInternal=function(a,b,c){a instanceof String&&(a=String(a));for(var e=a.length,d=0;d<e;d++){var k=a[d];if(b.call(c,k,d,a))return{i:d,v:k}}return{i:-1,v:void 0}};$jscomp.ASSUME_ES5=!1;$jscomp.ASSUME_NO_NATIVE_MAP=!1;$jscomp.ASSUME_NO_NATIVE_SET=!1;$jscomp.SIMPLE_FROUND_POLYFILL=!1;
$jscomp.defineProperty=$jscomp.ASSUME_ES5||"function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){a!=Array.prototype&&a!=Object.prototype&&(a[b]=c.value)};$jscomp.getGlobal=function(a){a=["object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof global&&global,a];for(var b=0;b<a.length;++b){var c=a[b];if(c&&c.Math==Math)return c}throw Error("Cannot find global object");};$jscomp.global=$jscomp.getGlobal(this);
$jscomp.polyfill=function(a,b,c,e){if(b){c=$jscomp.global;a=a.split(".");for(e=0;e<a.length-1;e++){var d=a[e];d in c||(c[d]={});c=c[d]}a=a[a.length-1];e=c[a];b=b(e);b!=e&&null!=b&&$jscomp.defineProperty(c,a,{configurable:!0,writable:!0,value:b})}};$jscomp.polyfill("Array.prototype.find",function(a){return a?a:function(a,c){return $jscomp.findInternal(this,a,c).v}},"es6","es3");
(function(a){"function"===typeof define&&define.amd?define(["jquery","datatables.net"],function(b){return a(b,window,document)}):"object"===typeof exports?module.exports=function(b,c){b||(b=window);c&&c.fn.dataTable||(c=require("datatables.net")(b,c).$);return a(c,b,b.document)}:a(jQuery,window,document)})(function(a,b,c,e){var d=a.fn.dataTable;a.extend(!0,d.defaults,{dom:"<'row'<'col-sm-6'l><'col-sm-6'f>><'row'<'col-sm-12'tr>><'row'<'col-sm-5'i><'col-sm-7'p>>",renderer:"bootstrap"});a.extend(d.ext.classes,
    {sWrapper:"dataTables_wrapper form-inline dt-bootstrap",sFilterInput:"form-control input-sm",sLengthSelect:"form-control input-sm",sProcessing:"dataTables_processing panel panel-default"});d.ext.renderer.pageButton.bootstrap=function(b,l,v,w,m,r){var k=new d.Api(b),x=b.oClasses,n=b.oLanguage.oPaginate,y=b.oLanguage.oAria.paginate||{},g,h,t=0,u=function(c,d){var e,l=function(b){b.preventDefault();a(b.currentTarget).hasClass("disabled")||k.page()==b.data.action||k.page(b.data.action).draw("page")};
    var q=0;for(e=d.length;q<e;q++){var f=d[q];if(a.isArray(f))u(c,f);else{h=g="";switch(f){case "ellipsis":g="&#x2026;";h="disabled";break;case "first":g=n.sFirst;h=f+(0<m?"":" disabled");break;case "previous":g=n.sPrevious;h=f+(0<m?"":" disabled");break;case "next":g=n.sNext;h=f+(m<r-1?"":" disabled");break;case "last":g=n.sLast;h=f+(m<r-1?"":" disabled");break;default:g=f+1,h=m===f?"active":""}if(g){var p=a("<li>",{"class":x.sPageButton+" "+h,id:0===v&&"string"===typeof f?b.sTableId+"_"+f:null}).append(a("<a>",
        {href:"#","aria-controls":b.sTableId,"aria-label":y[f],"data-dt-idx":t,tabindex:b.iTabIndex}).html(g)).appendTo(c);b.oApi._fnBindAction(p,{action:f},l);t++}}}};try{var p=a(l).find(c.activeElement).data("dt-idx")}catch(z){}u(a(l).empty().html('<ul class="pagination"/>').children("ul"),w);p!==e&&a(l).find("[data-dt-idx="+p+"]").trigger("focus")};return d});