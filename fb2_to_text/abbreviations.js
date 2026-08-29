// abbreviations.js

export const abbreviations = [
    // Английские обращения (встречаются в переведенной литературе)
    'Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.', 'St.',
    
    // Научные степени, титулы и профессии
    'Dipl.-Ing.', 'Dr.-Ing.', 'Dr. med.', 'Dr. rer. nat.', 'Dr. phil.', 'Prof. Dr.',
    'Mag.', 'B.A.', 'M.A.', 'B.Sc.', 'M.Sc.', 'Ph.D.', 'h.c.',
    'Kfm.', 'Kffr.', 'Gesf.', 'Dir.',

    // Немецкие обращения
    'Hr.', 'Fr.', 'Fam.', 'Frl.', 

    // Многосоставные сокращения (с пробелами и без)
    'z. B.', 'z.B.', 'd. h.', 'd.h.', 'u. a.', 'u.a.', 'u. a. m.', 'u.a.m.',
    'u. U.', 'u.U.', 'm. E.', 'm.E.', 'o. Ä.', 'o.Ä.', 'z. T.', 'z.T.',
    'z. Zt.', 'z.Zt.', 'i. d. R.', 'i.d.R.', 'i. A.', 'i.A.', 'i. V.', 'i.V.',
    'i. Tr.', 'i.Tr.', 'u. s. w.', 'u.s.w.', 'usw.', 'b. w.', 'b.w.',
    'm. a. W.', 'm.a.W.', 'v. a.', 'v.a.', 'w. z. b. w.', 'w.z.b.w.',

    // Юридические, коммерческие и организационные
    'e. V.', 'e.V.', 'e. G.', 'e.G.', 'GmbH.', 'GmbH',
    'Co.', 'KG.', 'OHG.', 'AG.', 'GbR.',
    'Abs.', 'Art.', 'Az.', 'BGB.', 'HGB.', 'StGB.', 'ZPO.', 'Rn.', 'Nr.',

    // Общие слова и выражения
    'bzw.', 'ca.', 'vgl.', 'inkl.', 'exkl.', 'sog.', 'evtl.', 'ggf.',
    'allg.', 'bes.', 'ehem.', 'etc.', 'bzgl.', 'bspw.', 'mind.', 'max.',
    'usf.', 'zzgl.', 'abzgl.', 'bed.', 'bez.', 'dgl.', 'einschl.', 'gem.',
    'mögl.', 'orig.', 'spez.', 'urspr.', 'zus.', 'zz.',

    // Меры, время, даты
    'Jh.', 'Jhd.', 'Mio.', 'Mrd.', 'Min.', 'Sek.', 'Std.', 'Mon.', 'Jhr.',
    'geb.', 'gest.', 'Chr.', 'v. Chr.', 'v.Chr.', 'n. Chr.', 'n.Chr.',
    'lfd. J.', 'lfd.J.',

    // Библиография, текст и ссылки
    'Aufl.', 'Kap.', 'S.', 'Abb.', 'Tab.', 'Anm.', 'Bd.', 'Hrsg.', 'Red.', 
    'Z.', 'Abschn.', 'Anh.', 'Beil.', 'Verf.', 'Zit.', 'ff.', 'f.',

    // Топонимика, адреса и контакты
    'Str.', 'Pl.', 'Hs.', 'Tel.', 'Fax.', 'Mob.'
].sort((a, b) => b.length - a.length); // Обязательная сортировка по убыванию длины