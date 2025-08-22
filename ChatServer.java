import java.io.*;
import java.net.*;
import java.util.*;
import java.text.SimpleDateFormat;

public class ChatServer {
    private static Set<PrintWriter> clientWriters = new HashSet<>();
    private static Set<String> clientNames = new HashSet<>();
    private static FileWriter logWriter;

    public static void main(String[] args) {
        int port = 12345; // Server port
        System.out.println("Chat Server started on port " + port);

        try (ServerSocket serverSocket = new ServerSocket(port)) {
            logWriter = new FileWriter("chat_log.txt", true); // append mode

            while (true) {
                Socket socket = serverSocket.accept();
                System.out.println("New client connected: " + socket);
                new ClientHandler(socket).start();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // Broadcast to all clients
    private static synchronized void broadcast(String message) {
        for (PrintWriter writer : clientWriters) {
            writer.println(message);
        }
        logMessage(message);
    }

    // Save messages in log file
    private static synchronized void logMessage(String message) {
        try {
            String timeStamp = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss").format(new Date());
            logWriter.write("[" + timeStamp + "] " + message + "\n");
            logWriter.flush();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    // Handle each client
    private static class ClientHandler extends Thread {
        private Socket socket;
        private PrintWriter out;
        private BufferedReader in;
        private String name;

        public ClientHandler(Socket socket) {
            this.socket = socket;
        }

        public void run() {
            try {
                in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
                out = new PrintWriter(socket.getOutputStream(), true);

                // Ask for a unique name
                while (true) {
                    out.println("Enter your name:");
                    name = in.readLine();
                    if (name == null) return;

                    synchronized (clientNames) {
                        if (!clientNames.contains(name)) {
                            clientNames.add(name);
                            break;
                        } else {
                            out.println("Name already taken, try again.");
                        }
                    }
                }

                out.println("Welcome " + name + "! Type '/exit' to leave.");
                synchronized (clientWriters) {
                    clientWriters.add(out);
                }

                broadcast("*** " + name + " has joined the chat ***");

                // Handle messages
                String message;
                while ((message = in.readLine()) != null) {
                    if (message.equalsIgnoreCase("/exit")) {
                        break;
                    }
                    broadcast(name + ": " + message);
                }

            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                try {
                    socket.close();
                } catch (IOException e) {}
                synchronized (clientWriters) {
                    clientWriters.remove(out);
                }
                synchronized (clientNames) {
                    if (name != null) {
                        clientNames.remove(name);
                        broadcast("*** " + name + " has left the chat ***");
                    }
                }
            }
        }
    }
}
