'use client';

import { ArrowLeft, Calendar, ChatCircleDots, CircleNotch, Envelope, GasCan, Gear, IdentificationCard, MapPin, Money, Phone, SignIn, Speedometer, Star, User, Warning, WhatsappLogo } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/providers/AppProvider';
import { getIntencaoCompra, getUserByEmail } from '@/lib/db';
import { formatarPreco, formatarData, obterWhatsApp, gerarLinkWhatsApp } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import SellerBadges from '@/components/trust/SellerBadges';
import type { IntencaoCompra } from '@/types/intencao';
import type { Usuario } from '@/types/usuario';

export default function DetalhesIntencao() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();
  const { auth, chat, loginModal } = useApp();
  const { user } = auth;
  const { abrirChat } = chat;
  const [intencao, setIntencao] = useState<IntencaoCompra | null>(null);
  const [loading, setLoading] = useState(true);
  const [mostrarTelefone, setMostrarTelefone] = useState(false);
  const [compradorProfile, setCompradorProfile] = useState<Usuario | null>(null);

  useEffect(() => {
    if (!id) return;
    getIntencaoCompra(id).then((data) => {
      setIntencao(data);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!intencao?.vendedorEmail) return;
    let stale = false;
    getUserByEmail(intencao.vendedorEmail).then((found) => {
      if (!stale && found) setCompradorProfile(found);
    });
    return () => { stale = true; };
  }, [intencao?.vendedorEmail]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <CircleNotch className="animate-spin text-3xl text-accent" />
      </div>
    );
  }

  if (!intencao) {
    return (
      <div className="text-center py-12">
        <Warning className="text-4xl text-slate-300 mb-3" />
        <p className="font-semibold text-fg-muted">Intenção não encontrada</p>
        <Button tipo="terciario" tamanho="sm" icone={<ArrowLeft />} onClick={() => router.push('/app')} className="mt-4">
          Voltar à página inicial
        </Button>
      </div>
    );
  }

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
  const whatsapp = obterWhatsApp(intencao.vendedorWhatsApp, intencao.vendedorTelefone);
  const telefone = intencao.vendedorTelefone;
  const email = intencao.vendedorEmail || '';
  const temWhatsApp = !!whatsapp;
  const temTelefone = !!telefone && intencao.mostrarTelefone;
  const temEmail = !!email;
  const isOwn = user?.uid === intencao.userId;
  const temChat = !!user && !!intencao.userId && !isOwn;

  const c = intencao.criterios;
  const p = intencao.preferencias;

  return (
    <div className="page-enter max-w-3xl mx-auto">
      <Button tipo="terciario" tamanho="sm" icone={<ArrowLeft />} onClick={() => router.back()} className="mb-3">
        Voltar
      </Button>

      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-fg-heading">{intencao.titulo}</h1>
            <p className="text-fg-subtle text-sm mt-1 flex items-center gap-1">
              <Calendar /> Publicado em {formatarData(intencao.criadaEm)}
            </p>
          </div>
          <Badge cor={intencao.status === 'ativa' ? 'green' : 'yellow'}>
            {intencao.status === 'ativa' ? 'Ativa' : 'Pausada'}
          </Badge>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 sm:p-5 mb-6">
          <h3 className="font-extrabold text-fg-heading mb-4 flex items-center gap-2">
            <IdentificationCard className="text-accent" /> Critérios de Busca
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
            <div>
              <span className="text-xs font-semibold text-fg-subtle">Marca</span>
              <p className="font-semibold text-fg-heading">{c.marca}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-fg-subtle">Modelo</span>
              <p className="font-semibold text-fg-heading">{c.modelo}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-fg-subtle">Ano</span>
              <p className="font-semibold text-fg-heading">{c.anoMinimo}{c.anoMaximo ? ` – ${c.anoMaximo}` : '+'}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-fg-subtle flex items-center gap-1"><Money /> Orçamento</span>
              <p className="font-semibold text-accent">
                {c.precoMinimo ? `${formatarPreco(c.precoMinimo)} – ` : 'Até '}{formatarPreco(c.precoMaximo)}
              </p>
            </div>
            <div>
              <span className="text-xs font-semibold text-fg-subtle flex items-center gap-1"><GasCan /> Combustível</span>
              <p className="font-semibold text-fg-heading">{c.combustivel.join(', ')}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-fg-subtle flex items-center gap-1"><Gear /> Transmissão</span>
              <p className="font-semibold text-fg-heading">{c.tipoTransmissao.join(', ')}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-fg-subtle flex items-center gap-1"><Speedometer /> Km máx</span>
              <p className="font-semibold text-fg-heading">{c.quilometragemMaxima.toLocaleString('pt-PT')} km</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-fg-subtle flex items-center gap-1"><MapPin /> Localização</span>
              <p className="font-semibold text-fg-heading">{c.localizacao.distrito} ({c.localizacao.raio} km)</p>
            </div>
          </div>
        </div>

        {p && (p.cores || p.tipoCarroceria || p.itensDesejados || p.aceitaFinanciamento !== undefined || p.aceitaTroca !== undefined) && (
          <div className="bg-slate-50 rounded-xl p-4 sm:p-5 mb-6">
            <h3 className="font-extrabold text-fg-heading mb-4">Preferências</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-sm">
              {p.cores && p.cores.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-fg-subtle">Cores</span>
                  <p className="font-semibold text-fg-heading">{p.cores.join(', ')}</p>
                </div>
              )}
              {p.tipoCarroceria && p.tipoCarroceria.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-fg-subtle">Carroceria</span>
                  <p className="font-semibold text-fg-heading">{p.tipoCarroceria.join(', ')}</p>
                </div>
              )}
              {p.itensDesejados && p.itensDesejados.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-fg-subtle">Itens desejados</span>
                  <p className="font-semibold text-fg-heading">{p.itensDesejados.join(', ')}</p>
                </div>
              )}
              {p.aceitaFinanciamento !== undefined && (
                <div>
                  <span className="text-xs font-semibold text-fg-subtle">Financiamento</span>
                  <p className="font-semibold text-fg-heading">{p.aceitaFinanciamento ? 'Aceita' : 'Não aceita'}</p>
                </div>
              )}
              {p.aceitaTroca !== undefined && (
                <div>
                  <span className="text-xs font-semibold text-fg-subtle">Troca</span>
                  <p className="font-semibold text-fg-heading">{p.aceitaTroca ? 'Aceita' : 'Não aceita'}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {intencao.descricao && (
          <div className="mb-6">
            <h3 className="font-extrabold text-fg-heading mb-2">Descrição</h3>
            <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">{intencao.descricao}</p>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm mt-6">
          <h3 className="font-extrabold text-fg-heading mb-4 flex items-center gap-2">
            <IdentificationCard className="text-accent" /> Contactar Comprador
          </h3>

          <div className="flex items-center gap-2 text-sm text-brand-700 mb-2">
            <User className="text-slate-400" />
            <span className="font-semibold">{intencao.vendedorNome || 'Comprador'}</span>
          </div>

          {compradorProfile && (
            <div className="mb-4">
              <SellerBadges
                verificado={compradorProfile.verificado}
                badges={compradorProfile.badges}
                mediaAvaliacoes={compradorProfile.mediaAvaliacoes}
                totalAvaliacoes={compradorProfile.totalAvaliacoes}
              />
            </div>
          )}

          {user ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {temWhatsApp ? (
                  <a
                    href={gerarLinkWhatsApp(whatsapp!, intencao.titulo)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-xl transition text-sm"
                  >
                    <WhatsappLogo className="text-lg" />
                    WhatsApp
                  </a>
                ) : (
                  <div
                    title="Comprador não disponibilizou WhatsApp"
                    className="flex items-center justify-center gap-2 bg-green-100 text-green-300 font-bold py-3 px-4 rounded-xl text-sm cursor-not-allowed"
                  >
                    <WhatsappLogo className="text-lg" />
                    WhatsApp indisponível
                  </div>
                )}

                {temEmail ? (
                  <a
                    href={`mailto:${email}`}
                    className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-fg font-semibold py-3 px-4 rounded-xl transition border border-slate-300 text-sm"
                  >
                    <Envelope />
                    Enviar Email
                  </a>
                ) : (
                  <div
                    title="Comprador não disponibilizou email"
                    className="flex items-center justify-center gap-2 bg-white text-fg-subtle font-semibold py-3 px-4 rounded-xl border border-slate-200 text-sm cursor-not-allowed"
                  >
                    <Envelope />
                    Email indisponível
                  </div>
                )}
              </div>

              <div className="mt-3">
                {temTelefone && !mostrarTelefone && (
                  <Button tipo="primario" tamanho="lg" blocoCompleto onClick={() => setMostrarTelefone(true)} icone={<Phone />}>
                    Ver Telefone
                  </Button>
                )}
                {temTelefone && mostrarTelefone && (
                  <a
                    href={`tel:${telefone}`}
                    className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-hover text-white font-bold py-3 px-4 rounded-xl transition text-sm"
                  >
                    <Phone />
                    {telefone}
                  </a>
                )}
                {!temTelefone && (
                  <div
                    title="Comprador não disponibilizou telefone"
                    className="flex items-center justify-center gap-2 w-full bg-slate-100 text-fg-subtle font-semibold py-3 px-4 rounded-xl text-sm cursor-not-allowed"
                  >
                    <Phone />
                    Telefone indisponível
                  </div>
                )}
              </div>

              <div className="mt-3">
                {temChat && (
                  <Button
                    tipo="azul"
                    tamanho="lg"
                    blocoCompleto
                    onClick={() => abrirChat(intencao.id, 'intencao', intencao.titulo, intencao.userId, intencao.vendedorNome || 'Comprador')}
                    icone={<ChatCircleDots />}
                  >
                    Enviar Mensagem (Chat Interno)
                  </Button>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => loginModal.openLoginModal(currentPath)}
              className="flex items-center justify-center gap-2 w-full bg-slate-100 hover:bg-slate-200 text-fg-muted font-semibold py-4 px-4 rounded-xl transition text-sm"
            >
              <SignIn />
              Faça login para ver os contactos
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs text-fg-subtle">
          <span>{intencao.stats.visualizacoes} visualizações</span>
          <span>{intencao.stats.contatos} contactos</span>
        </div>
      </div>
    </div>
  );
}
