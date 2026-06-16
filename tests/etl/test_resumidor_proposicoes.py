import pytest
from unittest.mock import MagicMock

from etl.resumidor_proposicoes import gerar_resumo_executivo, _MAX_CHUNK_CHARS


def _mock_gemini_client(resumo: str = "Resumo da proposicao gerado pelo LLM."):
    response = MagicMock()
    response.text = resumo
    client = MagicMock()
    client.models.generate_content.return_value = response
    return client


@pytest.mark.asyncio
async def test_gerar_resumo_executivo_sucesso():
    """
    Tracer bullet: dado um texto válido e um modelo Gemini mockado,
    a função deve retornar a string de resumo produzida pelo LLM.
    """
    texto = "Art. 1º Fica criado o Fundo Nacional de Educação Básica..."
    esperado = "Esta proposição cria o Fundo Nacional de Educação Básica."
    cliente = _mock_gemini_client(esperado)

    resumo = await gerar_resumo_executivo(texto, cliente)

    assert resumo == esperado
    cliente.models.generate_content.assert_called_once()


@pytest.mark.asyncio
async def test_gerar_resumo_texto_vazio_retorna_string_vazia():
    """
    Texto vazio não deve acionar a API Gemini e deve retornar string vazia.
    """
    cliente = _mock_gemini_client()

    resumo = await gerar_resumo_executivo("", cliente)

    assert resumo == ""
    cliente.models.generate_content.assert_not_called()


@pytest.mark.asyncio
async def test_gerar_resumo_usa_modelo_correto():
    """
    A chamada deve usar gemini-1.5-flash (verificado via model_name do objeto).
    """
    cliente = _mock_gemini_client("Resumo qualquer.")
    cliente.model_name = "gemini-2.0-flash"

    await gerar_resumo_executivo("Texto da proposição.", cliente)

    assert cliente.model_name == "gemini-2.0-flash"


@pytest.mark.asyncio
async def test_gerar_resumo_chama_generate_content_com_prompt():
    """
    A chamada deve passar o texto como parte do prompt para generate_content.
    """
    cliente = _mock_gemini_client("Resumo simples.")

    await gerar_resumo_executivo("Texto da proposição.", cliente)

    cliente.models.generate_content.assert_called_once()
    call_kwargs = cliente.models.generate_content.call_args
    prompt_enviado = call_kwargs.kwargs.get("contents") or call_kwargs[1].get("contents", "")
    assert "Texto da proposição." in prompt_enviado


@pytest.mark.asyncio
async def test_gerar_resumo_texto_longo_usa_map_reduce():
    """
    Textos maiores que _MAX_CHUNK_CHARS passam por map-reduce:
    o modelo é chamado uma vez por chunk (extração de pontos) mais
    uma chamada final de redução. O resultado é o resumo da redução.
    """
    texto_longo = ("Artigo da proposição legislativa. " * 1000)[: _MAX_CHUNK_CHARS + 100]

    def _make_resp(conteudo: str):
        r = MagicMock()
        r.text = conteudo
        return r

    cliente = MagicMock()
    cliente.models.generate_content.side_effect = [
        _make_resp("Pontos do trecho 1."),
        _make_resp("Pontos do trecho 2."),
        _make_resp("Resumo executivo final."),
    ]

    resultado = await gerar_resumo_executivo(texto_longo, cliente)

    assert resultado == "Resumo executivo final."
    # 2 chamadas de map (uma por chunk) + 1 de reduce
    assert cliente.models.generate_content.call_count == 3
