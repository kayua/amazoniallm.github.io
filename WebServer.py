# #!/usr/bin/env python3
# """
# Servidor Multiplayer para Minecraft Ultra Otimizado
# Execute: python server.py
# """
#
# import asyncio
# import websockets
# import json
# from datetime import datetime
#
# class GameServer:
#     def __init__(self):
#         self.players = {}
#         self.world_blocks = {}
#         self.chat_history = []
#         self.max_chat_history = 100
#
#     async def register_player(self, websocket):
#         """Registra um novo jogador"""
#         player_id = id(websocket)
#         self.players[player_id] = {
#             'id': player_id,
#             'websocket': websocket,
#             'position': {'x': 0, 'y': 25, 'z': 0},
#             'rotation': {'x': 0, 'y': 0},
#             'name': f'Jogador_{player_id % 1000}',
#             'health': 20,
#             'inventory': [],
#             'connected_at': datetime.now().isoformat()
#         }
#         print(f"✅ Jogador {player_id} conectado ({len(self.players)} jogadores online)")
#         return player_id
#
#     async def unregister_player(self, player_id):
#         """Remove um jogador"""
#         if player_id in self.players:
#             player_name = self.players[player_id]['name']
#             del self.players[player_id]
#             print(f"❌ Jogador {player_id} desconectado ({len(self.players)} jogadores online)")
#
#             # Notificar outros jogadores
#             await self.broadcast({
#                 'type': 'player_disconnect',
#                 'playerId': player_id,
#                 'playerName': player_name
#             }, exclude=player_id)
#
#     async def broadcast(self, message, exclude=None):
#         """Envia mensagem para todos os jogadores"""
#         if self.players:
#             message_json = json.dumps(message)
#             tasks = []
#             for player_id, player in self.players.items():
#                 if player_id != exclude:
#                     try:
#                         tasks.append(player['websocket'].send(message_json))
#                     except:
#                         pass
#             if tasks:
#                 await asyncio.gather(*tasks, return_exceptions=True)
#
#     async def send_to_player(self, player_id, message):
#         """Envia mensagem para um jogador específico"""
#         if player_id in self.players:
#             try:
#                 await self.players[player_id]['websocket'].send(json.dumps(message))
#             except:
#                 pass
#
#     async def handle_message(self, player_id, message):
#         """Processa mensagens dos jogadores"""
#         try:
#             data = json.loads(message)
#             msg_type = data.get('type')
#
#             if msg_type == 'player_update':
#                 # Atualizar posição/rotação do jogador
#                 if player_id in self.players:
#                     self.players[player_id]['position'] = data.get('position', {})
#                     self.players[player_id]['rotation'] = data.get('rotation', {})
#                     self.players[player_id]['health'] = data.get('health', 20)
#
#                     # Transmitir para outros jogadores
#                     await self.broadcast({
#                         'type': 'player_update',
#                         'playerId': player_id,
#                         'position': data.get('position'),
#                         'rotation': data.get('rotation'),
#                         'health': data.get('health')
#                     }, exclude=player_id)
#
#             elif msg_type == 'block_place':
#                 # Sincronizar colocação de bloco
#                 block_data = {
#                     'x': data['x'],
#                     'y': data['y'],
#                     'z': data['z'],
#                     'type': data['blockType']
#                 }
#                 key = f"{data['x']},{data['y']},{data['z']}"
#                 self.world_blocks[key] = block_data
#
#                 await self.broadcast({
#                     'type': 'block_place',
#                     'playerId': player_id,
#                     'x': data['x'],
#                     'y': data['y'],
#                     'z': data['z'],
#                     'blockType': data['blockType']
#                 }, exclude=player_id)
#
#             elif msg_type == 'block_break':
#                 # Sincronizar quebra de bloco
#                 key = f"{data['x']},{data['y']},{data['z']}"
#                 if key in self.world_blocks:
#                     del self.world_blocks[key]
#
#                 await self.broadcast({
#                     'type': 'block_break',
#                     'playerId': player_id,
#                     'x': data['x'],
#                     'y': data['y'],
#                     'z': data['z']
#                 }, exclude=player_id)
#
#             elif msg_type == 'chat_message':
#                 # Mensagem de chat
#                 chat_msg = {
#                     'type': 'chat_message',
#                     'playerId': player_id,
#                     'playerName': self.players[player_id]['name'],
#                     'message': data['message'],
#                     'timestamp': datetime.now().isoformat()
#                 }
#                 self.chat_history.append(chat_msg)
#
#                 # Manter histórico limitado
#                 if len(self.chat_history) > self.max_chat_history:
#                     self.chat_history = self.chat_history[-self.max_chat_history:]
#
#                 await self.broadcast(chat_msg)
#
#             elif msg_type == 'request_players':
#                 # Enviar lista de jogadores para o novo jogador
#                 players_list = []
#                 for pid, player in self.players.items():
#                     if pid != player_id:
#                         players_list.append({
#                             'playerId': pid,
#                             'name': player['name'],
#                             'position': player['position'],
#                             'rotation': player['rotation'],
#                             'health': player['health']
#                         })
#
#                 await self.send_to_player(player_id, {
#                     'type': 'players_list',
#                     'players': players_list
#                 })
#
#             elif msg_type == 'set_name':
#                 # Atualizar nome do jogador
#                 if player_id in self.players:
#                     old_name = self.players[player_id]['name']
#                     new_name = data.get('name', old_name)
#                     self.players[player_id]['name'] = new_name
#
#                     print(f"📝 Jogador {player_id} alterou nome: {old_name} → {new_name}")
#
#                     await self.broadcast({
#                         'type': 'player_rename',
#                         'playerId': player_id,
#                         'oldName': old_name,
#                         'newName': new_name
#                     })
#
#         except json.JSONDecodeError:
#             print(f"❌ Erro ao decodificar JSON do jogador {player_id}")
#         except Exception as e:
#             print(f"❌ Erro ao processar mensagem: {e}")
#
#     async def handler(self, websocket):
#         """Handler principal de conexões WebSocket - SEM path"""
#         player_id = await self.register_player(websocket)
#
#         try:
#             # Enviar ID do jogador
#             await websocket.send(json.dumps({
#                 'type': 'player_id',
#                 'playerId': player_id,
#                 'serverTime': datetime.now().isoformat()
#             }))
#
#             # Notificar outros jogadores
#             await self.broadcast({
#                 'type': 'player_connect',
#                 'playerId': player_id,
#                 'playerName': self.players[player_id]['name']
#             }, exclude=player_id)
#
#             # Loop de mensagens
#             async for message in websocket:
#                 await self.handle_message(player_id, message)
#
#         except websockets.exceptions.ConnectionClosed:
#             pass
#         except Exception as e:
#             print(f"❌ Erro no handler: {e}")
#         finally:
#             await self.unregister_player(player_id)
#
# async def main():
#     """Inicia o servidor"""
#     server = GameServer()
#
#     print("=" * 60)
#     print("🎮 SERVIDOR MULTIPLAYER MINECRAFT ULTRA OTIMIZADO")
#     print("=" * 60)
#     print(f"🌐 Servidor iniciado em: ws://localhost:8765")
#     print(f"📅 Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
#     print(f"✅ Aguardando conexões...")
#     print("=" * 60)
#     print()
#
#     # ✅ CORREÇÃO: usar serve() sem async with para versão nova
#     async with websockets.serve(server.handler, "localhost", 8765):
#         await asyncio.Future()  # Rodar para sempre
#
# if __name__ == "__main__":
#     try:
#         asyncio.run(main())
#     except KeyboardInterrupt:
#         print("\n\n🛑 Servidor encerrado pelo usuário")
#     except Exception as e:
#         print(f"\n\n❌ Erro fatal no servidor: {e}")



#!/usr/bin/env python3
"""
Servidor Multiplayer para Minecraft Ultra Otimizado - LAN
Execute: python server.py
Conecte-se via: ws://SEU_IP_LOCAL:8765
"""

import asyncio
import websockets
import json
import socket
from datetime import datetime
from typing import Dict, Set, List

class GameServer:
    def __init__(self):
        self.players = {}
        self.world_blocks = {}
        self.chat_history = []
        self.max_chat_history = 100
        self.ip_address = self.get_local_ip()

    def get_local_ip(self) -> str:
        """Obtém o endereço IP local da máquina"""
        try:
            # Cria um socket para descobrir o IP local
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except:
            return "127.0.0.1"

    async def register_player(self, websocket, client_address):
        """Registra um novo jogador"""
        player_id = id(websocket)
        self.players[player_id] = {
            'id': player_id,
            'websocket': websocket,
            'position': {'x': 0, 'y': 25, 'z': 0},
            'rotation': {'x': 0, 'y': 0},
            'name': f'Jogador_{player_id % 1000}',
            'health': 20,
            'inventory': [],
            'connected_at': datetime.now().isoformat(),
            'ip_address': client_address[0],
            'port': client_address[1]
        }

        player_name = self.players[player_id]['name']
        print(f"✅ Jogador {player_name} ({player_id}) conectado")
        print(f"   📍 Endereço: {client_address[0]}:{client_address[1]}")
        print(f"   👥 Total de jogadores: {len(self.players)}")
        print(f"   🕐 Horário: {datetime.now().strftime('%H:%M:%S')}")

        return player_id

    async def unregister_player(self, player_id):
        """Remove um jogador"""
        if player_id in self.players:
            player_name = self.players[player_id]['name']
            ip_address = self.players[player_id]['ip_address']
            del self.players[player_id]

            print(f"❌ Jogador {player_name} ({player_id}) desconectado")
            print(f"   📍 Endereço: {ip_address}")
            print(f"   👥 Total de jogadores: {len(self.players)}")

            # Notificar outros jogadores
            await self.broadcast({
                'type': 'player_disconnect',
                'playerId': player_id,
                'playerName': player_name
            }, exclude=player_id)

    async def broadcast(self, message, exclude=None):
        """Envia mensagem para todos os jogadores"""
        if not self.players:
            return

        message_json = json.dumps(message)
        tasks = []
        for player_id, player in self.players.items():
            if player_id != exclude:
                try:
                    tasks.append(player['websocket'].send(message_json))
                except:
                    # Se falhar ao enviar, o jogador será removido no próximo handler
                    pass

        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)

    async def send_to_player(self, player_id, message):
        """Envia mensagem para um jogador específico"""
        if player_id in self.players:
            try:
                await self.players[player_id]['websocket'].send(json.dumps(message))
            except:
                pass

    async def handle_message(self, player_id, message):
        """Processa mensagens dos jogadores"""
        try:
            data = json.loads(message)
            msg_type = data.get('type')

            if msg_type == 'player_update':
                # Atualizar posição/rotação do jogador
                if player_id in self.players:
                    self.players[player_id]['position'] = data.get('position', {})
                    self.players[player_id]['rotation'] = data.get('rotation', {})
                    self.players[player_id]['health'] = data.get('health', 20)

                    # Transmitir para outros jogadores
                    await self.broadcast({
                        'type': 'player_update',
                        'playerId': player_id,
                        'position': data.get('position'),
                        'rotation': data.get('rotation'),
                        'health': data.get('health')
                    }, exclude=player_id)

            elif msg_type == 'block_place':
                # Sincronizar colocação de bloco
                block_data = {
                    'x': data['x'],
                    'y': data['y'],
                    'z': data['z'],
                    'type': data['blockType']
                }
                key = f"{data['x']},{data['y']},{data['z']}"
                self.world_blocks[key] = block_data

                await self.broadcast({
                    'type': 'block_place',
                    'playerId': player_id,
                    'x': data['x'],
                    'y': data['y'],
                    'z': data['z'],
                    'blockType': data['blockType']
                }, exclude=player_id)

            elif msg_type == 'block_break':
                # Sincronizar quebra de bloco
                key = f"{data['x']},{data['y']},{data['z']}"
                if key in self.world_blocks:
                    del self.world_blocks[key]

                    await self.broadcast({
                        'type': 'block_break',
                        'playerId': player_id,
                        'x': data['x'],
                        'y': data['y'],
                        'z': data['z']
                    }, exclude=player_id)

            elif msg_type == 'chat_message':
                # Mensagem de chat
                chat_msg = {
                    'type': 'chat_message',
                    'playerId': player_id,
                    'playerName': self.players[player_id]['name'],
                    'message': data['message'],
                    'timestamp': datetime.now().isoformat()
                }
                self.chat_history.append(chat_msg)

                # Manter histórico limitado
                if len(self.chat_history) > self.max_chat_history:
                    self.chat_history = self.chat_history[-self.max_chat_history:]

                # Log no console
                print(f"💬 [{datetime.now().strftime('%H:%M:%S')}] {self.players[player_id]['name']}: {data['message']}")

                await self.broadcast(chat_msg)

            elif msg_type == 'request_players':
                # Enviar lista de jogadores para o novo jogador
                players_list = []
                for pid, player in self.players.items():
                    if pid != player_id:
                        players_list.append({
                            'playerId': pid,
                            'name': player['name'],
                            'position': player['position'],
                            'rotation': player['rotation'],
                            'health': player['health']
                        })

                # Enviar também blocos existentes
                blocks_list = list(self.world_blocks.values())

                await self.send_to_player(player_id, {
                    'type': 'players_list',
                    'players': players_list,
                    'blocks': blocks_list
                })

            elif msg_type == 'set_name':
                # Atualizar nome do jogador
                if player_id in self.players:
                    old_name = self.players[player_id]['name']
                    new_name = data.get('name', old_name)
                    self.players[player_id]['name'] = new_name

                    print(f"📝 Renomeação: {old_name} → {new_name}")

                    await self.broadcast({
                        'type': 'player_rename',
                        'playerId': player_id,
                        'oldName': old_name,
                        'newName': new_name
                    })

            elif msg_type == 'ping':
                # Resposta de ping para verificação de conexão
                await self.send_to_player(player_id, {
                    'type': 'pong',
                    'serverTime': datetime.now().isoformat(),
                    'onlinePlayers': len(self.players)
                })

            elif msg_type == 'request_server_info':
                # Informações do servidor
                await self.send_to_player(player_id, {
                    'type': 'server_info',
                    'serverName': 'Minecraft LAN Server',
                    'version': '1.0.0',
                    'maxPlayers': 50,
                    'onlinePlayers': len(self.players),
                    'serverTime': datetime.now().isoformat(),
                    'ip': self.ip_address,
                    'port': 8765
                })

        except json.JSONDecodeError:
            print(f"❌ Erro ao decodificar JSON do jogador {player_id}")
        except Exception as e:
            print(f"❌ Erro ao processar mensagem: {e}")

    async def handler(self, websocket, path=None):
        """Handler principal de conexões WebSocket"""
        client_address = websocket.remote_address
        player_id = await self.register_player(websocket, client_address)

        try:
            # Enviar ID do jogador e informações iniciais
            await websocket.send(json.dumps({
                'type': 'player_id',
                'playerId': player_id,
                'playerName': self.players[player_id]['name'],
                'serverTime': datetime.now().isoformat(),
                'serverIp': self.ip_address,
                'serverPort': 8765
            }))

            # Notificar outros jogadores
            await self.broadcast({
                'type': 'player_connect',
                'playerId': player_id,
                'playerName': self.players[player_id]['name'],
                'position': self.players[player_id]['position']
            }, exclude=player_id)

            # Loop de mensagens
            async for message in websocket:
                await self.handle_message(player_id, message)

        except websockets.exceptions.ConnectionClosed:
            pass
        except Exception as e:
            print(f"❌ Erro no handler do jogador {player_id}: {e}")
        finally:
            await self.unregister_player(player_id)

    async def health_check(self):
        """Verifica periodicamente a saúde das conexões"""
        while True:
            await asyncio.sleep(30)  # Verificar a cada 30 segundos
            if self.players:
                tasks = []
                for player_id, player in list(self.players.items()):
                    try:
                        tasks.append(
                            player['websocket'].ping()
                        )
                    except:
                        # Se ping falhar, remover jogador
                        print(f"⚠️  Ping falhou para {player['name']}, removendo...")
                        await self.unregister_player(player_id)

                if tasks:
                    await asyncio.gather(*tasks, return_exceptions=True)

async def main():
    """Inicia o servidor"""
    server = GameServer()

    # Obter IP local
    local_ip = server.get_local_ip()

    print("=" * 60)
    print("🎮 SERVIDOR MULTIPLAYER MINECRAFT - LAN")
    print("=" * 60)
    print(f"🌐 Endereços de conexão:")
    print(f"   • ws://{local_ip}:8765")
    print(f"   • ws://localhost:8765 (nesta máquina)")
    print("=" * 60)
    print(f"📅 Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"💻 Sistema: {socket.gethostname()}")
    print(f"👤 Aguardando jogadores na rede local...")
    print("=" * 60)
    print("📋 COMANDOS DISPONÍVEIS NO CONSOLE:")
    print("   • 'list' - Listar jogadores conectados")
    print("   • 'stats' - Mostrar estatísticas do servidor")
    print("   • 'stop' - Encerrar o servidor")
    print("   • 'clear' - Limpar console")
    print("=" * 60)
    print()

    # Iniciar tarefa de verificação de saúde
    health_task = asyncio.create_task(server.health_check())

    # Interface de console para comandos do servidor
    async def console_handler():
        while True:
            try:
                command = await asyncio.get_event_loop().run_in_executor(
                    None, input, "server> "
                )

                if command.strip().lower() == 'list':
                    print("\n📋 JOGADORES CONECTADOS:")
                    print("-" * 40)
                    for player_id, player in server.players.items():
                        ip = player.get('ip_address', 'N/A')
                        since = player.get('connected_at', 'N/A')
                        name = player['name']
                        print(f"• {name} (ID: {player_id})")
                        print(f"  📍 IP: {ip}")
                        print(f"  🕐 Conectado desde: {since}")
                        print(f"  ❤️  Vida: {player.get('health', 20)}/20")
                    print("-" * 40)
                    print(f"Total: {len(server.players)} jogador(es)")
                    print()

                elif command.strip().lower() == 'stats':
                    print("\n📊 ESTATÍSTICAS DO SERVIDOR:")
                    print("-" * 40)
                    print(f"• Jogadores online: {len(server.players)}")
                    print(f"• Blocos no mundo: {len(server.world_blocks)}")
                    print(f"• Mensagens no chat: {len(server.chat_history)}")
                    print(f"• Endereço LAN: {local_ip}:8765")
                    print(f"• Uptime: {datetime.now().strftime('%H:%M:%S')}")
                    print("-" * 40)
                    print()

                elif command.strip().lower() == 'stop':
                    print("\n🛑 Encerrando servidor...")
                    health_task.cancel()
                    # Notificar todos os jogadores
                    await server.broadcast({
                        'type': 'server_shutdown',
                        'message': 'Servidor está sendo encerrado'
                    })
                    await asyncio.sleep(1)
                    exit(0)

                elif command.strip().lower() == 'clear':
                    print("\n" * 50)
                    print("=" * 60)
                    print("🎮 CONSOLE DO SERVIDOR LIMPO")
                    print("=" * 60)
                    print()

                elif command.strip().lower() == 'help':
                    print("\n📋 COMANDOS DISPONÍVEIS:")
                    print("• list - Listar jogadores conectados")
                    print("• stats - Mostrar estatísticas do servidor")
                    print("• stop - Encerrar o servidor")
                    print("• clear - Limpar console")
                    print("• help - Mostrar esta ajuda")
                    print()

                else:
                    print(f"❌ Comando desconhecido: {command}")
                    print("   Digite 'help' para ver os comandos disponíveis")

            except (KeyboardInterrupt, EOFError):
                print("\n🛑 Encerrando servidor...")
                health_task.cancel()
                exit(0)
            except Exception as e:
                print(f"❌ Erro no console: {e}")

    # Iniciar handler de console
    console_task = asyncio.create_task(console_handler())

    # Iniciar servidor WebSocket
    try:
        async with websockets.serve(
                server.handler,
                "0.0.0.0",  # Aceitar conexões de qualquer interface
                8765,
                ping_interval=20,
                ping_timeout=40,
                max_size=10_485_760  # 10MB max
        ):
            print(f"✅ Servidor WebSocket iniciado na porta 8765")
            print(f"📡 Escutando em todas as interfaces de rede")
            print()

            # Aguardar ambas as tarefas
            await asyncio.gather(health_task, console_task)

    except Exception as e:
        print(f"❌ Erro ao iniciar servidor: {e}")
        health_task.cancel()
        console_task.cancel()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n🛑 Servidor encerrado pelo usuário")
    except Exception as e:
        print(f"\n\n❌ Erro fatal no servidor: {e}")
        import traceback
        traceback.print_exc()