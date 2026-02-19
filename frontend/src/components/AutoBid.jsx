/**
 * AutoBid - Automatisches Bieten für Auktionen
 * Features: Max-Preis setzen, automatische Gebote, Budget-Management
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Settings, Play, Pause, Trash2, RefreshCw, AlertTriangle,
  ChevronRight, Euro, Target, Clock, TrendingUp, X, Check, Edit2
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const AutoBid = ({ token, language = 'de' }) => {
  const navigate = useNavigate();
  const [autoBids, setAutoBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  const t = (key) => {
    const translations = {
      de: {
        title: 'Auto-Bid Manager',
        subtitle: 'Automatisch bieten und gewinnen',
        empty: 'Keine Auto-Bids konfiguriert',
        emptyHint: 'Aktiviere Auto-Bid bei einer Auktion, um automatisch zu bieten',
        maxPrice: 'Max. Preis',
        maxBids: 'Max. Gebote',
        bidsPlaced: 'Gesetzte Gebote',
        status: 'Status',
        active: 'Aktiv',
        paused: 'Pausiert',
        completed: 'Abgeschlossen',
        deactivated: 'Deaktiviert',
        activate: 'Aktivieren',
        pause: 'Pausieren',
        delete: 'Löschen',
        save: 'Speichern',
        cancel: 'Abbrechen',
        edit: 'Bearbeiten',
        currentPrice: 'Aktueller Preis',
        remaining: 'Verbleibend',
        viewAuction: 'Zur Auktion',
        bidDelay: 'Verzögerung',
        seconds: 'Sekunden',
        toAuctions: 'Zu den Auktionen',
        howItWorks: 'Wie funktioniert Auto-Bid?',
        hint1: 'Setze einen maximalen Preis, den du zahlen möchtest',
        hint2: 'Das System bietet automatisch für dich, wenn du überboten wirst',
        hint3: 'Deine Gebote werden nur eingesetzt, wenn der Preis unter deinem Maximum liegt',
        hint4: 'Du kannst jederzeit pausieren oder deine Limits anpassen',
        reasons: {
          max_bids_reached: 'Max. Gebote erreicht',
          max_price_reached: 'Max. Preis erreicht',
          no_bids: 'Keine Gebote mehr',
          auction_ended: 'Auktion beendet'
        }
      },
      en: {
        title: 'Auto-Bid Manager',
        subtitle: 'Bid automatically and win',
        empty: 'No auto-bids configured',
        emptyHint: 'Enable auto-bid on an auction to bid automatically',
        maxPrice: 'Max. Price',
        maxBids: 'Max. Bids',
        bidsPlaced: 'Bids Placed',
        status: 'Status',
        active: 'Active',
        paused: 'Paused',
        completed: 'Completed',
        deactivated: 'Deactivated',
        activate: 'Activate',
        pause: 'Pause',
        delete: 'Delete',
        save: 'Save',
        cancel: 'Cancel',
        edit: 'Edit',
        currentPrice: 'Current Price',
        remaining: 'Remaining',
        viewAuction: 'View Auction',
        bidDelay: 'Delay',
        seconds: 'seconds',
        toAuctions: 'Go to auctions',
        howItWorks: 'How does Auto-Bid work?',
        hint1: 'Set a maximum price you\'re willing to pay',
        hint2: 'The system automatically bids for you when outbid',
        hint3: 'Your bids are only placed when the price is below your maximum',
        hint4: 'You can pause or adjust your limits anytime',
        reasons: {
          max_bids_reached: 'Max bids reached',
          max_price_reached: 'Max price reached',
          no_bids: 'No bids left',
          auction_ended: 'Auction ended'
        }
      },
      tr: {
        title: 'Otomatik Teklif Yöneticisi',
        subtitle: 'Otomatik teklif ver ve kazan',
        empty: 'Yapılandırılmış otomatik teklif yok',
        emptyHint: 'Otomatik teklif vermek için bir açık artırmada etkinleştirin',
        maxPrice: 'Maks. Fiyat',
        maxBids: 'Maks. Teklif',
        bidsPlaced: 'Verilen Teklifler',
        status: 'Durum',
        active: 'Aktif',
        paused: 'Duraklatıldı',
        completed: 'Tamamlandı',
        deactivated: 'Devre Dışı',
        activate: 'Etkinleştir',
        pause: 'Duraklat',
        delete: 'Sil',
        save: 'Kaydet',
        cancel: 'İptal',
        edit: 'Düzenle',
        currentPrice: 'Mevcut Fiyat',
        remaining: 'Kalan',
        viewAuction: 'Açık Artırmayı Gör',
        bidDelay: 'Gecikme',
        seconds: 'saniye',
        toAuctions: 'Açık artırmalara git',
        howItWorks: 'Otomatik Teklif nasıl çalışır?',
        hint1: 'Ödemek istediğiniz maksimum fiyatı belirleyin',
        hint2: 'Sistem, geçildiğinizde sizin için otomatik teklif verir',
        hint3: 'Teklifleriniz yalnızca fiyat maksimumunuzun altındayken verilir',
        hint4: 'İstediğiniz zaman duraklatabilir veya limitlrinizi ayarlayabilirsiniz',
        reasons: {
          max_bids_reached: 'Maks. teklif sayısına ulaşıldı',
          max_price_reached: 'Maks. fiyata ulaşıldı',
          no_bids: 'Teklif kalmadı',
          auction_ended: 'Açık artırma sona erdi'
        }
      },
      fr: {
        title: 'Gestionnaire d\'Enchères Auto',
        subtitle: 'Enchérissez automatiquement et gagnez',
        empty: 'Aucune enchère automatique configurée',
        emptyHint: 'Activez l\'enchère automatique sur une enchère',
        maxPrice: 'Prix Max.',
        maxBids: 'Enchères Max.',
        bidsPlaced: 'Enchères Placées',
        status: 'Statut',
        active: 'Actif',
        paused: 'En pause',
        completed: 'Terminé',
        deactivated: 'Désactivé',
        activate: 'Activer',
        pause: 'Pause',
        delete: 'Supprimer',
        save: 'Enregistrer',
        cancel: 'Annuler',
        edit: 'Modifier',
        currentPrice: 'Prix Actuel',
        remaining: 'Restant',
        viewAuction: 'Voir l\'enchère',
        bidDelay: 'Délai',
        seconds: 'secondes',
        toAuctions: 'Aller aux enchères',
        howItWorks: 'Comment fonctionne l\'Enchère Auto?',
        hint1: 'Définissez un prix maximum que vous êtes prêt à payer',
        hint2: 'Le système enchérit automatiquement pour vous quand vous êtes surenchéri',
        hint3: 'Vos enchères ne sont placées que lorsque le prix est inférieur à votre maximum',
        hint4: 'Vous pouvez mettre en pause ou ajuster vos limites à tout moment',
        reasons: {
          max_bids_reached: 'Enchères max. atteintes',
          max_price_reached: 'Prix max. atteint',
          no_bids: 'Plus d\'enchères',
          auction_ended: 'Enchère terminée'
        }
      },
      es: {
        title: 'Gestor de Pujas Automáticas',
        subtitle: 'Puja automáticamente y gana',
        empty: 'No hay pujas automáticas configuradas',
        emptyHint: 'Activa la puja automática en una subasta',
        maxPrice: 'Precio Máx.',
        maxBids: 'Pujas Máx.',
        bidsPlaced: 'Pujas Realizadas',
        status: 'Estado',
        active: 'Activo',
        paused: 'Pausado',
        completed: 'Completado',
        deactivated: 'Desactivado',
        activate: 'Activar',
        pause: 'Pausar',
        delete: 'Eliminar',
        save: 'Guardar',
        cancel: 'Cancelar',
        edit: 'Editar',
        currentPrice: 'Precio Actual',
        remaining: 'Restante',
        viewAuction: 'Ver Subasta',
        bidDelay: 'Retraso',
        seconds: 'segundos',
        toAuctions: 'Ir a subastas',
        howItWorks: '¿Cómo funciona la Puja Automática?',
        hint1: 'Establece un precio máximo que estés dispuesto a pagar',
        hint2: 'El sistema puja automáticamente cuando te superan',
        hint3: 'Tus pujas solo se colocan cuando el precio está por debajo de tu máximo',
        hint4: 'Puedes pausar o ajustar tus límites en cualquier momento',
        reasons: {
          max_bids_reached: 'Pujas máx. alcanzadas',
          max_price_reached: 'Precio máx. alcanzado',
          no_bids: 'Sin pujas',
          auction_ended: 'Subasta terminada'
        }
      },
      ar: {
        title: 'مدير المزايدة التلقائية',
        subtitle: 'زايد تلقائياً واربح',
        empty: 'لا توجد مزايدات تلقائية مكونة',
        emptyHint: 'فعّل المزايدة التلقائية في مزاد للمزايدة تلقائياً',
        maxPrice: 'السعر الأقصى',
        maxBids: 'المزايدات القصوى',
        bidsPlaced: 'المزايدات المقدمة',
        status: 'الحالة',
        active: 'نشط',
        paused: 'متوقف مؤقتاً',
        completed: 'مكتمل',
        deactivated: 'معطل',
        activate: 'تفعيل',
        pause: 'إيقاف مؤقت',
        delete: 'حذف',
        save: 'حفظ',
        cancel: 'إلغاء',
        edit: 'تعديل',
        currentPrice: 'السعر الحالي',
        remaining: 'المتبقي',
        viewAuction: 'عرض المزاد',
        bidDelay: 'التأخير',
        seconds: 'ثواني',
        toAuctions: 'الذهاب للمزادات',
        howItWorks: 'كيف تعمل المزايدة التلقائية؟',
        hint1: 'حدد السعر الأقصى الذي ترغب في دفعه',
        hint2: 'النظام يزايد تلقائياً عندما يتجاوزك أحد',
        hint3: 'مزايداتك تُقدم فقط عندما يكون السعر أقل من حدك الأقصى',
        hint4: 'يمكنك الإيقاف المؤقت أو تعديل حدودك في أي وقت',
        reasons: {
          max_bids_reached: 'تم الوصول للحد الأقصى',
          max_price_reached: 'تم الوصول للسعر الأقصى',
          no_bids: 'لا مزايدات متبقية',
          auction_ended: 'انتهى المزاد'
        }
      },
      it: {
        title: 'Gestore Offerte Automatiche',
        subtitle: 'Offri automaticamente e vinci',
        empty: 'Nessuna offerta automatica configurata',
        emptyHint: 'Attiva l\'offerta automatica su un\'asta',
        maxPrice: 'Prezzo Max.',
        maxBids: 'Offerte Max.',
        bidsPlaced: 'Offerte Piazzate',
        status: 'Stato',
        active: 'Attivo',
        paused: 'In pausa',
        completed: 'Completato',
        deactivated: 'Disattivato',
        activate: 'Attiva',
        pause: 'Pausa',
        delete: 'Elimina',
        save: 'Salva',
        cancel: 'Annulla',
        edit: 'Modifica',
        currentPrice: 'Prezzo Attuale',
        remaining: 'Rimanente',
        viewAuction: 'Vedi Asta',
        bidDelay: 'Ritardo',
        seconds: 'secondi',
        toAuctions: 'Vai alle aste',
        howItWorks: 'Come funziona l\'Offerta Automatica?',
        hint1: 'Imposta un prezzo massimo che sei disposto a pagare',
        hint2: 'Il sistema offre automaticamente quando vieni superato',
        hint3: 'Le tue offerte vengono piazzate solo quando il prezzo è sotto il tuo massimo',
        hint4: 'Puoi mettere in pausa o modificare i tuoi limiti in qualsiasi momento',
        reasons: {
          max_bids_reached: 'Offerte max. raggiunte',
          max_price_reached: 'Prezzo max. raggiunto',
          no_bids: 'Nessuna offerta rimasta',
          auction_ended: 'Asta terminata'
        }
      },
      pt: {
        title: 'Gerenciador de Lances Automáticos',
        subtitle: 'Lance automaticamente e ganhe',
        empty: 'Nenhum lance automático configurado',
        emptyHint: 'Ative o lance automático em um leilão',
        maxPrice: 'Preço Máx.',
        maxBids: 'Lances Máx.',
        bidsPlaced: 'Lances Dados',
        status: 'Status',
        active: 'Ativo',
        paused: 'Pausado',
        completed: 'Concluído',
        deactivated: 'Desativado',
        activate: 'Ativar',
        pause: 'Pausar',
        delete: 'Excluir',
        save: 'Salvar',
        cancel: 'Cancelar',
        edit: 'Editar',
        currentPrice: 'Preço Atual',
        remaining: 'Restante',
        viewAuction: 'Ver Leilão',
        bidDelay: 'Atraso',
        seconds: 'segundos',
        toAuctions: 'Ir para leilões',
        howItWorks: 'Como funciona o Lance Automático?',
        hint1: 'Defina um preço máximo que você está disposto a pagar',
        hint2: 'O sistema dá lances automaticamente quando você é superado',
        hint3: 'Seus lances só são dados quando o preço está abaixo do seu máximo',
        hint4: 'Você pode pausar ou ajustar seus limites a qualquer momento',
        reasons: {
          max_bids_reached: 'Lances máx. atingidos',
          max_price_reached: 'Preço máx. atingido',
          no_bids: 'Sem lances restantes',
          auction_ended: 'Leilão encerrado'
        }
      },
      nl: {
        title: 'Auto-Bied Beheerder',
        subtitle: 'Bied automatisch en win',
        empty: 'Geen auto-biedingen geconfigureerd',
        emptyHint: 'Activeer auto-bieden op een veiling',
        maxPrice: 'Max. Prijs',
        maxBids: 'Max. Biedingen',
        bidsPlaced: 'Geplaatste Biedingen',
        status: 'Status',
        active: 'Actief',
        paused: 'Gepauzeerd',
        completed: 'Voltooid',
        deactivated: 'Gedeactiveerd',
        activate: 'Activeren',
        pause: 'Pauzeren',
        delete: 'Verwijderen',
        save: 'Opslaan',
        cancel: 'Annuleren',
        edit: 'Bewerken',
        currentPrice: 'Huidige Prijs',
        remaining: 'Resterend',
        viewAuction: 'Bekijk Veiling',
        bidDelay: 'Vertraging',
        seconds: 'seconden',
        toAuctions: 'Naar veilingen',
        howItWorks: 'Hoe werkt Auto-Bieden?',
        hint1: 'Stel een maximumprijs in die je bereid bent te betalen',
        hint2: 'Het systeem biedt automatisch wanneer je wordt overboden',
        hint3: 'Je biedingen worden alleen geplaatst als de prijs onder je maximum is',
        hint4: 'Je kunt op elk moment pauzeren of je limieten aanpassen',
        reasons: {
          max_bids_reached: 'Max. biedingen bereikt',
          max_price_reached: 'Max. prijs bereikt',
          no_bids: 'Geen biedingen over',
          auction_ended: 'Veiling beëindigd'
        }
      },
      pl: {
        title: 'Menedżer Auto-Licytacji',
        subtitle: 'Licytuj automatycznie i wygrywaj',
        empty: 'Brak skonfigurowanych auto-licytacji',
        emptyHint: 'Włącz auto-licytację na aukcji',
        maxPrice: 'Maks. Cena',
        maxBids: 'Maks. Licytacje',
        bidsPlaced: 'Złożone Licytacje',
        status: 'Status',
        active: 'Aktywny',
        paused: 'Wstrzymany',
        completed: 'Ukończony',
        deactivated: 'Dezaktywowany',
        activate: 'Aktywuj',
        pause: 'Wstrzymaj',
        delete: 'Usuń',
        save: 'Zapisz',
        cancel: 'Anuluj',
        edit: 'Edytuj',
        currentPrice: 'Aktualna Cena',
        remaining: 'Pozostało',
        viewAuction: 'Zobacz Aukcję',
        bidDelay: 'Opóźnienie',
        seconds: 'sekund',
        toAuctions: 'Idź do aukcji',
        howItWorks: 'Jak działa Auto-Licytacja?',
        hint1: 'Ustaw maksymalną cenę, którą jesteś gotów zapłacić',
        hint2: 'System automatycznie licytuje, gdy zostaniesz przebity',
        hint3: 'Twoje oferty są składane tylko gdy cena jest poniżej Twojego maksimum',
        hint4: 'Możesz w każdej chwili wstrzymać lub dostosować swoje limity',
        reasons: {
          max_bids_reached: 'Osiągnięto maks. licytacji',
          max_price_reached: 'Osiągnięto maks. cenę',
          no_bids: 'Brak licytacji',
          auction_ended: 'Aukcja zakończona'
        }
      },
      ru: {
        title: 'Менеджер Авто-ставок',
        subtitle: 'Делайте ставки автоматически и выигрывайте',
        empty: 'Авто-ставки не настроены',
        emptyHint: 'Включите авто-ставку на аукционе',
        maxPrice: 'Макс. Цена',
        maxBids: 'Макс. Ставки',
        bidsPlaced: 'Сделанные Ставки',
        status: 'Статус',
        active: 'Активно',
        paused: 'Приостановлено',
        completed: 'Завершено',
        deactivated: 'Деактивировано',
        activate: 'Активировать',
        pause: 'Пауза',
        delete: 'Удалить',
        save: 'Сохранить',
        cancel: 'Отмена',
        edit: 'Редактировать',
        currentPrice: 'Текущая Цена',
        remaining: 'Осталось',
        viewAuction: 'Смотреть Аукцион',
        bidDelay: 'Задержка',
        seconds: 'секунд',
        toAuctions: 'К аукционам',
        howItWorks: 'Как работает Авто-ставка?',
        hint1: 'Установите максимальную цену, которую вы готовы заплатить',
        hint2: 'Система автоматически делает ставки, когда вас перебивают',
        hint3: 'Ваши ставки делаются только когда цена ниже вашего максимума',
        hint4: 'Вы можете приостановить или изменить лимиты в любое время',
        reasons: {
          max_bids_reached: 'Достигнут макс. ставок',
          max_price_reached: 'Достигнута макс. цена',
          no_bids: 'Ставок не осталось',
          auction_ended: 'Аукцион завершён'
        }
      },
      zh: {
        title: '自动出价管理器',
        subtitle: '自动出价并赢得胜利',
        empty: '未配置自动出价',
        emptyHint: '在拍卖中启用自动出价',
        maxPrice: '最高价格',
        maxBids: '最大出价次数',
        bidsPlaced: '已出价',
        status: '状态',
        active: '活跃',
        paused: '已暂停',
        completed: '已完成',
        deactivated: '已停用',
        activate: '激活',
        pause: '暂停',
        delete: '删除',
        save: '保存',
        cancel: '取消',
        edit: '编辑',
        currentPrice: '当前价格',
        remaining: '剩余',
        viewAuction: '查看拍卖',
        bidDelay: '延迟',
        seconds: '秒',
        toAuctions: '去拍卖',
        howItWorks: '自动出价如何工作？',
        hint1: '设置您愿意支付的最高价格',
        hint2: '当您被超越时，系统会自动为您出价',
        hint3: '只有当价格低于您的最高价时才会出价',
        hint4: '您可以随时暂停或调整限额',
        reasons: {
          max_bids_reached: '已达最大出价次数',
          max_price_reached: '已达最高价格',
          no_bids: '无剩余出价',
          auction_ended: '拍卖已结束'
        }
      },
      ja: {
        title: '自動入札マネージャー',
        subtitle: '自動入札して勝利しよう',
        empty: '自動入札が設定されていません',
        emptyHint: 'オークションで自動入札を有効にしてください',
        maxPrice: '最高価格',
        maxBids: '最大入札数',
        bidsPlaced: '入札済み',
        status: 'ステータス',
        active: 'アクティブ',
        paused: '一時停止',
        completed: '完了',
        deactivated: '無効',
        activate: '有効化',
        pause: '一時停止',
        delete: '削除',
        save: '保存',
        cancel: 'キャンセル',
        edit: '編集',
        currentPrice: '現在価格',
        remaining: '残り',
        viewAuction: 'オークションを見る',
        bidDelay: '遅延',
        seconds: '秒',
        toAuctions: 'オークションへ',
        howItWorks: '自動入札の仕組み',
        hint1: '支払い可能な最高価格を設定',
        hint2: '上回られた場合、システムが自動的に入札',
        hint3: '価格が最高額以下の場合のみ入札',
        hint4: 'いつでも一時停止や制限の調整が可能',
        reasons: {
          max_bids_reached: '最大入札数に達しました',
          max_price_reached: '最高価格に達しました',
          no_bids: '入札残りなし',
          auction_ended: 'オークション終了'
        }
      },
      ko: {
        title: '자동 입찰 관리자',
        subtitle: '자동으로 입찰하고 승리하세요',
        empty: '설정된 자동 입찰이 없습니다',
        emptyHint: '경매에서 자동 입찰을 활성화하세요',
        maxPrice: '최대 가격',
        maxBids: '최대 입찰 수',
        bidsPlaced: '입찰 완료',
        status: '상태',
        active: '활성',
        paused: '일시 중지',
        completed: '완료',
        deactivated: '비활성화',
        activate: '활성화',
        pause: '일시 중지',
        delete: '삭제',
        save: '저장',
        cancel: '취소',
        edit: '편집',
        currentPrice: '현재 가격',
        remaining: '남은',
        viewAuction: '경매 보기',
        bidDelay: '지연',
        seconds: '초',
        toAuctions: '경매로 이동',
        howItWorks: '자동 입찰 작동 방식',
        hint1: '지불할 의향이 있는 최대 가격 설정',
        hint2: '입찰이 초과되면 시스템이 자동으로 입찰',
        hint3: '가격이 최대값 이하일 때만 입찰',
        hint4: '언제든지 일시 중지하거나 한도 조정 가능',
        reasons: {
          max_bids_reached: '최대 입찰 수 도달',
          max_price_reached: '최대 가격 도달',
          no_bids: '남은 입찰 없음',
          auction_ended: '경매 종료'
        }
      }
    };
    return translations[language]?.[key] || translations.de[key] || key;
  };

  const fetchAutoBids = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    
    try {
      const response = await fetch(`${API}/api/auto-bid/my-auto-bids`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setAutoBids(data.auto_bids || []);
    } catch (error) {
      console.error('Error fetching auto-bids:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAutoBids();
  }, [fetchAutoBids]);

  const toggleAutoBid = async (auctionId) => {
    try {
      const response = await fetch(`${API}/api/auto-bid/toggle/${auctionId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAutoBids(prev => prev.map(ab => 
          ab.auction_id === auctionId ? { ...ab, is_active: data.is_active } : ab
        ));
        toast.success(data.message);
      }
    } catch (error) {
      toast.error('Fehler beim Umschalten');
    }
  };

  const deleteAutoBid = async (autoBidId) => {
    if (!window.confirm('Auto-Bid wirklich löschen?')) return;
    
    try {
      const response = await fetch(`${API}/api/auto-bid/${autoBidId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setAutoBids(prev => prev.filter(ab => ab.id !== autoBidId));
        toast.success('Auto-Bid gelöscht');
      }
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };

  const updateAutoBid = async (autoBidId) => {
    const values = editValues[autoBidId];
    if (!values) return;
    
    try {
      const response = await fetch(`${API}/api/auto-bid/${autoBidId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });
      
      if (response.ok) {
        setAutoBids(prev => prev.map(ab => 
          ab.id === autoBidId ? { ...ab, ...values } : ab
        ));
        setEditingId(null);
        toast.success('Auto-Bid aktualisiert');
      }
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const startEditing = (ab) => {
    setEditingId(ab.id);
    setEditValues({
      [ab.id]: {
        max_price: ab.max_price,
        max_bids: ab.max_bids
      }
    });
  };

  const activeCount = autoBids.filter(ab => ab.is_active).length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4" data-testid="auto-bid-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Zap className="w-6 h-6 text-amber-500" />
              {t('title')}
            </h1>
            <p className="text-gray-400 text-sm">{t('subtitle')}</p>
          </div>
          
          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full text-sm">
                <Play className="w-4 h-4" />
                {activeCount} {t('active')}
              </div>
            )}
            <Button
              onClick={fetchAutoBids}
              variant="outline"
              size="sm"
              className="border-gray-600"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Auto-Bids List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : autoBids.length === 0 ? (
          <div className="text-center py-12 bg-gray-800/50 rounded-xl">
            <Zap className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">{t('empty')}</p>
            <p className="text-gray-500 text-sm mb-4">{t('emptyHint')}</p>
            <Button
              onClick={() => navigate('/auctions')}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Zu den Auktionen
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {autoBids.map((ab) => (
              <AutoBidCard
                key={ab.id}
                autoBid={ab}
                isEditing={editingId === ab.id}
                editValues={editValues[ab.id] || {}}
                onEditChange={(field, value) => 
                  setEditValues(prev => ({
                    ...prev,
                    [ab.id]: { ...prev[ab.id], [field]: value }
                  }))
                }
                onToggle={() => toggleAutoBid(ab.auction_id)}
                onDelete={() => deleteAutoBid(ab.id)}
                onEdit={() => startEditing(ab)}
                onSave={() => updateAutoBid(ab.id)}
                onCancel={() => setEditingId(null)}
                onView={() => navigate(`/auctions/${ab.auction_id}`)}
                t={t}
              />
            ))}
          </div>
        )}

        {/* Info Box */}
        <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <h3 className="font-semibold text-amber-400 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" />
            Wie funktioniert Auto-Bid?
          </h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• Setze einen maximalen Preis, den du zahlen möchtest</li>
            <li>• Das System bietet automatisch für dich, wenn du überboten wirst</li>
            <li>• Deine Gebote werden nur eingesetzt, wenn der Preis unter deinem Maximum liegt</li>
            <li>• Du kannst jederzeit pausieren oder deine Limits anpassen</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Auto-Bid Card Component
const AutoBidCard = ({ 
  autoBid, 
  isEditing, 
  editValues, 
  onEditChange, 
  onToggle, 
  onDelete, 
  onEdit,
  onSave,
  onCancel,
  onView, 
  t 
}) => {
  const isActive = autoBid.is_active;
  const isCompleted = autoBid.auction_status === 'completed' || autoBid.auction_status === 'ended';
  const deactivationReason = autoBid.deactivation_reason;
  
  const progressPercent = autoBid.max_bids > 0 
    ? Math.min(100, (autoBid.bids_placed / autoBid.max_bids) * 100)
    : 0;

  return (
    <div 
      className={`bg-gray-800/50 rounded-xl p-4 border transition-all ${
        isActive ? 'border-green-500/50' : 'border-gray-700/50'
      }`}
      data-testid={`auto-bid-${autoBid.id}`}
    >
      <div className="flex items-start gap-4">
        {/* Auction Image */}
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
          {autoBid.auction_image ? (
            <img 
              src={autoBid.auction_image} 
              alt={autoBid.auction_title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <Target className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="font-semibold text-white truncate">
              {autoBid.auction_title || 'Unbekannte Auktion'}
            </h3>
            <div className={`px-2 py-1 rounded text-xs font-medium ${
              isActive ? 'bg-green-500/20 text-green-400' : 
              isCompleted ? 'bg-gray-500/20 text-gray-400' :
              'bg-yellow-500/20 text-yellow-400'
            }`}>
              {isActive ? t('active') : isCompleted ? t('completed') : t('paused')}
            </div>
          </div>

          {/* Stats Grid */}
          {isEditing ? (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-gray-400 text-xs block mb-1">{t('maxPrice')}</label>
                <Input
                  type="number"
                  step="0.50"
                  value={editValues.max_price || ''}
                  onChange={(e) => onEditChange('max_price', parseFloat(e.target.value))}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
              <div>
                <label className="text-gray-400 text-xs block mb-1">{t('maxBids')}</label>
                <Input
                  type="number"
                  value={editValues.max_bids || ''}
                  onChange={(e) => onEditChange('max_bids', parseInt(e.target.value))}
                  className="bg-gray-700 border-gray-600"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <div>
                <span className="text-gray-400 text-xs block">{t('maxPrice')}</span>
                <span className="text-amber-400 font-bold">€{autoBid.max_price?.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">{t('currentPrice')}</span>
                <span className="text-white font-medium">€{autoBid.auction_current_price?.toFixed(2) || '0.00'}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">{t('bidsPlaced')}</span>
                <span className="text-white font-medium">{autoBid.bids_placed} / {autoBid.max_bids}</span>
              </div>
              <div>
                <span className="text-gray-400 text-xs block">{t('remaining')}</span>
                <span className="text-white font-medium">{autoBid.max_bids - autoBid.bids_placed}</span>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-3">
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all ${
                  progressPercent >= 80 ? 'bg-red-500' : 
                  progressPercent >= 50 ? 'bg-yellow-500' : 
                  'bg-green-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Deactivation Reason */}
          {deactivationReason && !isActive && (
            <div className="text-yellow-400 text-xs flex items-center gap-1 mb-2">
              <AlertTriangle className="w-3 h-3" />
              {t(`reasons.${deactivationReason}`) || deactivationReason}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {isEditing ? (
            <>
              <Button onClick={onSave} size="sm" className="bg-green-500 hover:bg-green-600">
                <Check className="w-4 h-4" />
              </Button>
              <Button onClick={onCancel} size="sm" variant="outline" className="border-gray-600">
                <X className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <>
              <Button onClick={onView} size="sm" className="bg-amber-500 hover:bg-amber-600">
                <ChevronRight className="w-4 h-4" />
              </Button>
              {!isCompleted && (
                <>
                  <Button
                    onClick={onToggle}
                    size="sm"
                    variant="outline"
                    className={isActive ? 'border-yellow-500/50 text-yellow-400' : 'border-green-500/50 text-green-400'}
                  >
                    {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <Button onClick={onEdit} size="sm" variant="outline" className="border-gray-600">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button
                onClick={onDelete}
                size="sm"
                variant="outline"
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AutoBid;
