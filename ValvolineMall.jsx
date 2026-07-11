import React, { useEffect, useMemo, useState } from 'react'

// ─────────────────────────────────────────────────────────────
// 발보린(Valvoline) 사업자 전용몰 — 프로토타입
// 정비소 · 카센터 · 세차장 등 사업자 대상 B2B 쇼핑몰 데모
// ─────────────────────────────────────────────────────────────

const BRAND = {
  red: '#cc0a2f',
  redDark: '#a30825',
  navy: '#12233d',
  navyLight: '#1c3557',
  bg: '#f5f6f8',
  line: '#e4e7ec',
  text: '#222831',
  sub: '#7b8494',
}

const CATEGORIES = [
  { id: 'all', name: '전체상품' },
  { id: 'gasoline', name: '가솔린 엔진오일' },
  { id: 'diesel', name: '디젤/상용 엔진오일' },
  { id: 'transmission', name: '미션오일' },
  { id: 'coolant', name: '부동액/냉각수' },
  { id: 'chemical', name: '케미컬/첨가제' },
]

const PRODUCTS = [
  { id: 1, cat: 'gasoline', badge: 'BEST', name: '발보린 신파워 5W-30 합성 엔진오일', spec: '1L × 12개 (1박스)', consumer: 156000, biz: 98000, tag: 'API SP / GF-6', emoji: '🛢️' },
  { id: 2, cat: 'gasoline', badge: 'BEST', name: '발보린 신파워 0W-20 하이브리드 전용', spec: '1L × 12개 (1박스)', consumer: 168000, biz: 109000, tag: '하이브리드/GDI 최적화', emoji: '🛢️' },
  { id: 3, cat: 'gasoline', badge: '특가', name: '발보린 어드밴스드 풀신세틱 5W-40', spec: '4L × 4개 (1박스)', consumer: 192000, biz: 115000, tag: '100% 합성유', emoji: '🛢️' },
  { id: 4, cat: 'gasoline', badge: null, name: '발보린 VR1 레이싱 5W-50', spec: '1L × 12개 (1박스)', consumer: 216000, biz: 149000, tag: '고성능/서킷', emoji: '🏁' },
  { id: 5, cat: 'gasoline', badge: null, name: '발보린 맥스라이프 5W-30 (주행거리 8만km↑)', spec: '1L × 12개 (1박스)', consumer: 144000, biz: 89000, tag: '실링 컨디셔너 함유', emoji: '🛢️' },
  { id: 6, cat: 'diesel', badge: 'BEST', name: '발보린 프리미엄 블루 15W-40 상용디젤', spec: '20L 말통', consumer: 138000, biz: 86000, tag: 'CK-4 / 대형트럭·버스', emoji: '🚛' },
  { id: 7, cat: 'diesel', badge: null, name: '발보린 올플릿 10W-40 디젤 엔진오일', spec: '6L × 3개 (1박스)', consumer: 126000, biz: 79000, tag: 'DPF 안전', emoji: '🚛' },
  { id: 8, cat: 'diesel', badge: '특가', name: '발보린 프리미엄 블루 15W-40 드럼', spec: '200L 드럼', consumer: 1290000, biz: 790000, tag: '드럼 단위 최저가', emoji: '🛢️' },
  { id: 9, cat: 'transmission', badge: 'BEST', name: '발보린 맥스라이프 멀티비히클 ATF', spec: '1L × 12개 (1박스)', consumer: 132000, biz: 84000, tag: '자동변속기 범용', emoji: '⚙️' },
  { id: 10, cat: 'transmission', badge: null, name: '발보린 기어오일 75W-90 GL-5', spec: '1L × 12개 (1박스)', consumer: 148000, biz: 96000, tag: '수동/디퍼렌셜', emoji: '⚙️' },
  { id: 11, cat: 'coolant', badge: null, name: '발보린 지렉스(ZEREX) 부동액 G05', spec: '4L × 4개 (1박스)', consumer: 96000, biz: 58000, tag: '장수명 냉각수', emoji: '🧊' },
  { id: 12, cat: 'coolant', badge: '특가', name: '지렉스 아시안 비히클 사계절 냉각수', spec: '4L × 4개 (1박스)', consumer: 104000, biz: 62000, tag: '국산차/일본차 전용', emoji: '🧊' },
  { id: 13, cat: 'chemical', badge: null, name: '발보린 연료 시스템 클리너', spec: '350ml × 24개 (1박스)', consumer: 168000, biz: 99000, tag: '인젝터 세정', emoji: '🧪' },
  { id: 14, cat: 'chemical', badge: null, name: '발보린 엔진 플러시', spec: '500ml × 12개 (1박스)', consumer: 108000, biz: 66000, tag: '오일교환 전 세정', emoji: '🧪' },
  { id: 15, cat: 'chemical', badge: 'BEST', name: '발보린 브레이크 & 파츠 클리너', spec: '500ml × 24개 (1박스)', consumer: 120000, biz: 69000, tag: '정비 필수품', emoji: '🧪' },
  { id: 16, cat: 'chemical', badge: null, name: '발보린 멀티퍼포스 그리스', spec: '400g × 20개 (1박스)', consumer: 140000, biz: 88000, tag: '리튬계 범용', emoji: '🧪' },
]

const HERO_SLIDES = [
  {
    bg: `linear-gradient(120deg, ${BRAND.navy} 0%, ${BRAND.navyLight} 55%, ${BRAND.red} 130%)`,
    kicker: '발보린 사업자 전용몰 OPEN',
    title: '정비소·카센터·세차장 사장님,\n오픈 기념 전 품목 최대 40% 할인',
    desc: '사업자 회원 가입 시 첫 주문 배송비 무료 + 신파워 1L 샘플 증정',
    cta: '오픈 혜택 받기',
  },
  {
    bg: `linear-gradient(120deg, ${BRAND.red} 0%, ${BRAND.redDark} 60%, ${BRAND.navy} 140%)`,
    kicker: '드럼/말통 대량구매관',
    title: '많이 쓰는 오일,\n드럼 단위로 더 저렴하게',
    desc: '프리미엄 블루 200L 드럼 등 대용량 상품 견적 상담 지원',
    cta: '대량구매 견적 문의',
  },
  {
    bg: `linear-gradient(120deg, #1a1f2b 0%, ${BRAND.navy} 60%, ${BRAND.navyLight} 130%)`,
    kicker: '월말 정산도 간편하게',
    title: '세금계산서 자동 발행,\n사업자 구매의 기본',
    desc: '주문 즉시 국세청 전자세금계산서 자동 발행 (데모)',
    cta: '자세히 보기',
  },
]

const BENEFITS = [
  { emoji: '🏷️', title: '사업자 전용가', desc: '소비자가 대비 평균 35% 저렴한 공급가' },
  { emoji: '📦', title: '박스/드럼 단위 공급', desc: '대량구매 시 추가 할인 및 견적 상담' },
  { emoji: '🚚', title: '무료 배송', desc: '30만원 이상 주문 시 전국 무료배송' },
  { emoji: '🧾', title: '세금계산서 자동발행', desc: '구매 즉시 전자세금계산서 발행' },
]

const won = (n) => n.toLocaleString('ko-KR') + '원'
const discountRate = (c, b) => Math.round((1 - b / c) * 100)

export default function ValvolineMall() {
  const [category, setCategory] = useState('all')
  const [tab, setTab] = useState('전체')
  const [query, setQuery] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [cart, setCart] = useState({}) // id -> qty
  const [cartOpen, setCartOpen] = useState(false)
  const [slide, setSlide] = useState(0)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % HERO_SLIDES.length), 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 1800)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => {
    let list = PRODUCTS
    if (category !== 'all') list = list.filter((p) => p.cat === category)
    if (tab === '베스트') list = list.filter((p) => p.badge === 'BEST')
    if (tab === '특가') list = list.filter((p) => p.badge === '특가')
    const q = query.trim()
    if (q) list = list.filter((p) => (p.name + p.tag + p.spec).toLowerCase().includes(q.toLowerCase()))
    return list
  }, [category, tab, query])

  const cartItems = useMemo(
    () => Object.entries(cart).map(([id, qty]) => ({ ...PRODUCTS.find((p) => p.id === Number(id)), qty })),
    [cart]
  )
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0)
  const cartTotal = cartItems.reduce((s, i) => s + i.biz * i.qty, 0)

  const addToCart = (p) => {
    if (!loggedIn) {
      setToast('사업자 회원 로그인 후 구매할 수 있습니다')
      return
    }
    setCart((c) => ({ ...c, [p.id]: (c[p.id] || 0) + 1 }))
    setToast(`장바구니에 담았습니다 · ${p.name.slice(0, 18)}…`)
  }
  const setQty = (id, qty) => {
    setCart((c) => {
      const next = { ...c }
      if (qty <= 0) delete next[id]
      else next[id] = qty
      return next
    })
  }

  return (
    <div style={{ fontFamily: "'Pretendard', 'Noto Sans KR', -apple-system, sans-serif", background: BRAND.bg, color: BRAND.text, minHeight: '100%' }}>
      <style>{`
        button { cursor: pointer; font-family: inherit; }
        input { font-family: inherit; }
        .card { transition: transform .15s ease, box-shadow .15s ease; }
        .card:hover { transform: translateY(-3px); box-shadow: 0 10px 24px rgba(18,35,61,.12); }
        .navbtn:hover { color: ${BRAND.red}; }
        .cta:hover { filter: brightness(1.08); }
        @keyframes toastUp { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>

      {/* 상단 공지 바 */}
      <div style={{ background: BRAND.navy, color: '#cdd6e4', fontSize: 12.5, textAlign: 'center', padding: '7px 12px' }}>
        🔧 발보린 <b style={{ color: '#fff' }}>사업자 전용몰</b> 그랜드 오픈 — 정비소 · 카센터 · 세차장 사장님을 위한 공급가 혜택 (데모 프로토타입)
      </div>

      {/* 헤더 */}
      <header style={{ background: '#fff', borderBottom: `1px solid ${BRAND.line}`, position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div style={{ width: 38, height: 38, borderRadius: 8, background: BRAND.red, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: 22, fontStyle: 'italic' }}>V</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 19, letterSpacing: -0.5 }}>발보린 <span style={{ color: BRAND.red }}>사업자몰</span></div>
              <div style={{ fontSize: 11, color: BRAND.sub, marginTop: 1 }}>VALVOLINE BIZ MALL</div>
            </div>
          </div>
          <div style={{ flex: 1, maxWidth: 460, display: 'flex', border: `2px solid ${BRAND.red}`, borderRadius: 24, overflow: 'hidden' }}>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="상품명, 규격 검색 (예: 5W-30, ATF, 드럼)"
              style={{ flex: 1, border: 'none', outline: 'none', padding: '10px 16px', fontSize: 14 }}
            />
            <button aria-label="검색" style={{ border: 'none', background: BRAND.red, color: '#fff', padding: '0 18px', fontSize: 16 }}>🔍</button>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <button
              onClick={() => { setLoggedIn(!loggedIn); setToast(loggedIn ? '로그아웃 되었습니다' : '사업자 회원으로 로그인했습니다 (데모)') }}
              style={{ border: `1px solid ${loggedIn ? BRAND.line : BRAND.red}`, background: loggedIn ? '#fff' : BRAND.red, color: loggedIn ? BRAND.text : '#fff', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 700 }}
            >
              {loggedIn ? '로그아웃' : '사업자 로그인'}
            </button>
            <button onClick={() => setCartOpen(true)} style={{ position: 'relative', border: `1px solid ${BRAND.line}`, background: '#fff', borderRadius: 20, padding: '8px 16px', fontSize: 13, fontWeight: 700 }}>
              🛒 장바구니
              {cartCount > 0 && (
                <span style={{ position: 'absolute', top: -7, right: -7, background: BRAND.red, color: '#fff', borderRadius: 999, fontSize: 11, fontWeight: 800, padding: '2px 7px' }}>{cartCount}</span>
              )}
            </button>
          </div>
        </div>
        {/* 카테고리 내비게이션 */}
        <nav style={{ borderTop: `1px solid ${BRAND.line}` }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 4, overflowX: 'auto' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                className="navbtn"
                onClick={() => { setCategory(c.id); setTab('전체') }}
                style={{
                  border: 'none', background: 'none', padding: '13px 14px', fontSize: 14.5, whiteSpace: 'nowrap',
                  fontWeight: category === c.id ? 800 : 600,
                  color: category === c.id ? BRAND.red : BRAND.text,
                  borderBottom: category === c.id ? `3px solid ${BRAND.red}` : '3px solid transparent',
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* 히어로 배너 */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        {HERO_SLIDES.map((s, i) => (
          <div
            key={i}
            style={{
              background: s.bg, color: '#fff',
              display: i === slide ? 'block' : 'none',
            }}
          >
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '58px 20px 66px' }}>
              <div style={{ display: 'inline-block', background: 'rgba(255,255,255,.16)', borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 700, letterSpacing: 0.3 }}>{s.kicker}</div>
              <h1 style={{ fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, lineHeight: 1.25, margin: '16px 0 12px', whiteSpace: 'pre-line', letterSpacing: -0.5 }}>{s.title}</h1>
              <p style={{ fontSize: 15.5, opacity: 0.85, marginBottom: 26 }}>{s.desc}</p>
              <button className="cta" onClick={() => setToast('데모 프로토타입입니다 — 실제 이벤트 페이지는 준비 중')} style={{ background: '#fff', color: BRAND.navy, border: 'none', borderRadius: 26, padding: '13px 30px', fontSize: 15, fontWeight: 800 }}>
                {s.cta} →
              </button>
            </div>
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8 }}>
          {HERO_SLIDES.map((_, i) => (
            <button key={i} aria-label={`배너 ${i + 1}`} onClick={() => setSlide(i)} style={{ width: i === slide ? 22 : 8, height: 8, borderRadius: 4, border: 'none', background: i === slide ? '#fff' : 'rgba(255,255,255,.45)', transition: 'width .2s' }} />
          ))}
        </div>
      </section>

      {/* 사업자 혜택 스트립 */}
      <section style={{ background: '#fff', borderBottom: `1px solid ${BRAND.line}` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '22px 20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {BENEFITS.map((b) => (
            <div key={b.title} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 28 }}>{b.emoji}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14.5 }}>{b.title}</div>
                <div style={{ fontSize: 12.5, color: BRAND.sub, marginTop: 2 }}>{b.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 상품 목록 */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 20px 60px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>
            {CATEGORIES.find((c) => c.id === category).name}
            <span style={{ fontSize: 14, color: BRAND.sub, fontWeight: 600, marginLeft: 8 }}>{filtered.length}개 상품</span>
          </h2>
          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
            {['전체', '베스트', '특가'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  border: `1px solid ${tab === t ? BRAND.red : BRAND.line}`, borderRadius: 18, padding: '7px 16px', fontSize: 13, fontWeight: 700,
                  background: tab === t ? BRAND.red : '#fff', color: tab === t ? '#fff' : BRAND.text,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {!loggedIn && (
          <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 10, padding: '12px 16px', fontSize: 13.5, marginBottom: 20, color: '#9a3412' }}>
            🔒 사업자 전용가는 <b>사업자 회원 로그인 후</b> 확인할 수 있습니다. 우측 상단 <b>사업자 로그인</b> 버튼으로 데모 로그인해 보세요.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 18 }}>
          {filtered.map((p) => (
            <div key={p.id} className="card" style={{ background: '#fff', border: `1px solid ${BRAND.line}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ position: 'relative', background: `linear-gradient(135deg, #eef1f5, #e2e7ee)`, height: 150, display: 'grid', placeItems: 'center', fontSize: 56 }}>
                {p.emoji}
                {p.badge && (
                  <span style={{ position: 'absolute', top: 10, left: 10, background: p.badge === 'BEST' ? BRAND.navy : BRAND.red, color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 6, padding: '4px 8px' }}>{p.badge}</span>
                )}
              </div>
              <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ fontSize: 11.5, color: BRAND.red, fontWeight: 700 }}>{p.tag}</div>
                <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.4, margin: '5px 0 3px' }}>{p.name}</div>
                <div style={{ fontSize: 12.5, color: BRAND.sub }}>{p.spec}</div>
                <div style={{ marginTop: 12, marginBottom: 14 }}>
                  <div style={{ fontSize: 12.5, color: BRAND.sub, textDecoration: 'line-through' }}>소비자가 {won(p.consumer)}</div>
                  {loggedIn ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginTop: 2 }}>
                      <span style={{ color: BRAND.red, fontWeight: 900, fontSize: 17 }}>{discountRate(p.consumer, p.biz)}%</span>
                      <span style={{ fontWeight: 900, fontSize: 18 }}>{won(p.biz)}</span>
                    </div>
                  ) : (
                    <div style={{ marginTop: 2, fontWeight: 800, fontSize: 14.5, color: BRAND.navy }}>🔒 사업자 전용가 (로그인 후 공개)</div>
                  )}
                </div>
                <button
                  onClick={() => addToCart(p)}
                  className="cta"
                  style={{ marginTop: 'auto', border: 'none', background: loggedIn ? BRAND.red : BRAND.navy, color: '#fff', borderRadius: 9, padding: '11px 0', fontWeight: 800, fontSize: 14 }}
                >
                  {loggedIn ? '장바구니 담기' : '로그인하고 가격보기'}
                </button>
              </div>
            </div>
          ))}
        </div>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '70px 0', color: BRAND.sub }}>조건에 맞는 상품이 없습니다.</div>
        )}

        {/* 대량구매 견적 배너 */}
        <section style={{ marginTop: 44, background: BRAND.navy, borderRadius: 16, color: '#fff', padding: '30px 28px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 18 }}>
          <div style={{ flex: '1 1 320px' }}>
            <div style={{ fontWeight: 900, fontSize: 21, letterSpacing: -0.3 }}>드럼 · 팔레트 단위 대량구매가 필요하신가요?</div>
            <div style={{ fontSize: 14, opacity: 0.8, marginTop: 6 }}>월 사용량 기준 맞춤 견적과 정기 공급 계약을 상담해 드립니다. (프랜차이즈 · 직영점 다점포 지원)</div>
          </div>
          <button className="cta" onClick={() => setToast('견적 문의 폼은 데모에서 준비 중입니다')} style={{ background: BRAND.red, color: '#fff', border: 'none', borderRadius: 26, padding: '13px 28px', fontWeight: 800, fontSize: 15 }}>
            대량구매 견적 문의 →
          </button>
        </section>
      </main>

      {/* 푸터 */}
      <footer style={{ background: '#20242c', color: '#9aa3b2', fontSize: 12.5, lineHeight: 1.9 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 20px' }}>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, marginBottom: 6 }}>발보린 사업자몰 (데모 프로토타입)</div>
          상호: (주)OO컴퍼니 · 대표: OOO · 사업자등록번호: 000-00-00000 · 통신판매업신고: 제0000-서울-0000호<br />
          주소: 서울특별시 OO구 OO로 000 · 고객센터: 0000-0000 (평일 09:00~18:00) · 이메일: help@example.com<br />
          <span style={{ opacity: 0.7 }}>본 페이지는 UI 데모이며 실제 판매·결제 기능이 없습니다. Valvoline™은 해당 소유자의 상표입니다.</span>
        </div>
      </footer>

      {/* 장바구니 드로어 */}
      {cartOpen && (
        <div onClick={() => setCartOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 60 }}>
          <aside onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(400px, 92vw)', background: '#fff', display: 'flex', flexDirection: 'column', boxShadow: '-8px 0 30px rgba(0,0,0,.2)' }}>
            <div style={{ padding: '18px 20px', borderBottom: `1px solid ${BRAND.line}`, display: 'flex', alignItems: 'center' }}>
              <b style={{ fontSize: 17 }}>🛒 장바구니 <span style={{ color: BRAND.red }}>{cartCount}</span></b>
              <button onClick={() => setCartOpen(false)} style={{ marginLeft: 'auto', border: 'none', background: 'none', fontSize: 20, color: BRAND.sub }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
              {cartItems.length === 0 && <div style={{ textAlign: 'center', color: BRAND.sub, padding: '60px 0' }}>담긴 상품이 없습니다.</div>}
              {cartItems.map((i) => (
                <div key={i.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${BRAND.line}` }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, background: '#eef1f5', display: 'grid', placeItems: 'center', fontSize: 26, flexShrink: 0 }}>{i.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.35 }}>{i.name}</div>
                    <div style={{ fontSize: 12, color: BRAND.sub, marginTop: 2 }}>{i.spec}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <div style={{ display: 'flex', border: `1px solid ${BRAND.line}`, borderRadius: 7, overflow: 'hidden' }}>
                        <button onClick={() => setQty(i.id, i.qty - 1)} style={{ border: 'none', background: '#f5f6f8', width: 26, height: 26, fontWeight: 800 }}>−</button>
                        <span style={{ width: 32, display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700 }}>{i.qty}</span>
                        <button onClick={() => setQty(i.id, i.qty + 1)} style={{ border: 'none', background: '#f5f6f8', width: 26, height: 26, fontWeight: 800 }}>＋</button>
                      </div>
                      <b style={{ marginLeft: 'auto', fontSize: 14.5 }}>{won(i.biz * i.qty)}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 20px 20px', borderTop: `1px solid ${BRAND.line}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
                <span style={{ color: BRAND.sub }}>총 주문금액 (VAT 포함)</span>
                <b style={{ fontSize: 18, color: BRAND.red }}>{won(cartTotal)}</b>
              </div>
              <div style={{ fontSize: 12, color: BRAND.sub, marginBottom: 12 }}>{cartTotal >= 300000 ? '🚚 무료배송 적용!' : `30만원 이상 주문 시 무료배송 (${won(300000 - cartTotal)} 남음)`}</div>
              <button
                onClick={() => setToast('데모 프로토타입 — 결제 기능은 연결되어 있지 않습니다')}
                disabled={cartItems.length === 0}
                className="cta"
                style={{ width: '100%', border: 'none', background: cartItems.length ? BRAND.red : '#cfd4dd', color: '#fff', borderRadius: 10, padding: '14px 0', fontWeight: 900, fontSize: 15.5 }}
              >
                주문하기 · 세금계산서 발행
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: 'rgba(18,35,61,.94)', color: '#fff', borderRadius: 24, padding: '11px 22px', fontSize: 13.5, fontWeight: 600, zIndex: 80, animation: 'toastUp .2s ease', whiteSpace: 'nowrap', maxWidth: '90vw', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {toast}
        </div>
      )}
    </div>
  )
}
